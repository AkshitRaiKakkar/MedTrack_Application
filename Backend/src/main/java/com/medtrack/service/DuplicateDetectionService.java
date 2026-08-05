package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.DuplicateGroupResponse;
import com.medtrack.dto.DuplicateMatch;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.util.StringSimilarity;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Duplicate detection & reconciliation (issue #746).
 *
 * <p>The same physical device gets registered twice when the second entry differs from the first
 * by a typo, stray space or case difference that a strict-uniqueness check cannot see. This
 * service normalises identifiers before comparing them (see {@link StringSimilarity}) so those
 * near-ties surface as warnings at entry time and as a reconciliation list afterwards, and it
 * merges confirmed duplicates by combining stock, carrying history over to the surviving record
 * and archiving the duplicate.</p>
 */
@Service
@RequiredArgsConstructor
public class DuplicateDetectionService {

    private static final double SERIAL_THRESHOLD = 0.75;
    private static final double CODE_THRESHOLD = 0.75;
    private static final double NAME_MODEL_THRESHOLD = 0.8;
    private static final double EXACT_SIMILARITY = 0.999;

    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    private Hospital getHospitalForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user"));
    }

    /**
     * Checks an asset being created/edited against the hospital's inventory. The caller's own id
     * (when editing) is excluded so an asset never warns about itself.
     */
    @Transactional(readOnly = true)
    public List<DuplicateMatch> checkForDuplicates(String username, Long excludeId,
                                                   String name, String model,
                                                   String serialNumber, String equipmentCode) {
        if (isBlank(name) && isBlank(model) && isBlank(serialNumber) && isBlank(equipmentCode)) {
            return List.of();
        }
        Hospital hospital = getHospitalForUser(username);
        List<DuplicateMatch> matches = new ArrayList<>();
        for (Equipment existing : equipmentRepository.findByHospitalId(hospital.getId())) {
            if (excludeId != null && excludeId.equals(existing.getId())) {
                continue;
            }
            DuplicateMatch match = matchAgainst(existing, name, model, serialNumber, equipmentCode);
            if (match != null) {
                matches.add(match);
            }
        }
        matches.sort(Comparator.comparing(DuplicateMatch::getSimilarity).reversed());
        return matches;
    }

    private DuplicateMatch matchAgainst(Equipment existing, String name, String model,
                                        String serialNumber, String equipmentCode) {
        double best = 0.0;
        String matchedOn = null;

        if (!isBlank(serialNumber) && !isBlank(existing.getSerialNumber())) {
            double sim = StringSimilarity.similarity(serialNumber, existing.getSerialNumber());
            if (sim > best) {
                best = sim;
                matchedOn = "SERIAL_NUMBER";
            }
        }
        if (!isBlank(equipmentCode) && !isBlank(existing.getEquipmentCode())) {
            double sim = StringSimilarity.similarity(equipmentCode, existing.getEquipmentCode());
            if (sim > best) {
                best = sim;
                matchedOn = "ASSET_CODE";
            }
        }
        if (!isBlank(name) && !isBlank(existing.getName())) {
            double sim = StringSimilarity.similarity(name, existing.getName());
            if (sim > best) {
                best = sim;
                matchedOn = "NAME_MODEL";
            }
        }
        if (best == 0.0 || best < thresholdFor(matchedOn)) {
            return null;
        }
        return DuplicateMatch.builder()
                .id(existing.getId())
                .equipmentCode(existing.getEquipmentCode())
                .name(existing.getName())
                .model(existing.getModel())
                .serialNumber(existing.getSerialNumber())
                .department(existing.getDepartment())
                .exact(best >= EXACT_SIMILARITY)
                .similarity(Math.round(best * 1000.0) / 1000.0)
                .matchedOn(matchedOn)
                .build();
    }

    private double thresholdFor(String matchedOn) {
        if ("SERIAL_NUMBER".equals(matchedOn)) {
            return SERIAL_THRESHOLD;
        }
        if ("ASSET_CODE".equals(matchedOn)) {
            return CODE_THRESHOLD;
        }
        return NAME_MODEL_THRESHOLD;
    }

    /**
     * Groups the whole inventory into probable duplicate clusters by normalised serial number,
     * normalised asset code, or name+model. Buckets with a single member are not duplicates and
     * are omitted.
     */
    @Transactional(readOnly = true)
    public List<DuplicateGroupResponse> findDuplicateGroups(String username) {
        Hospital hospital = getHospitalForUser(username);
        List<Equipment> inventory = equipmentRepository.findByHospitalId(hospital.getId());

        Map<String, List<Equipment>> bySerial = new LinkedHashMap<>();
        Map<String, List<Equipment>> byCode = new LinkedHashMap<>();
        Map<String, List<Equipment>> byNameModel = new LinkedHashMap<>();

        for (Equipment equipment : inventory) {
            if (!isBlank(equipment.getSerialNumber())) {
                bySerial.computeIfAbsent(StringSimilarity.normalize(equipment.getSerialNumber()),
                                key -> new ArrayList<>())
                        .add(equipment);
            }
            if (!isBlank(equipment.getEquipmentCode())) {
                byCode.computeIfAbsent(StringSimilarity.normalize(equipment.getEquipmentCode()),
                                key -> new ArrayList<>())
                        .add(equipment);
            }
            if (!isBlank(equipment.getName()) && !isBlank(equipment.getModel())) {
                byNameModel.computeIfAbsent(
                                StringSimilarity.normalize(equipment.getName()) + "|"
                                        + StringSimilarity.normalize(equipment.getModel()),
                                key -> new ArrayList<>())
                        .add(equipment);
            }
        }

        List<DuplicateGroupResponse> groups = new ArrayList<>();
        collectGroups(groups, bySerial, "SERIAL_NUMBER");
        collectGroups(groups, byCode, "ASSET_CODE");
        collectGroups(groups, byNameModel, "NAME_MODEL");
        return groups;
    }

    private void collectGroups(List<DuplicateGroupResponse> groups,
                               Map<String, List<Equipment>> buckets,
                               String matchedOn) {
        for (List<Equipment> bucket : buckets.values()) {
            if (bucket.size() > 1) {
                groups.add(DuplicateGroupResponse.builder()
                        .matchedOn(matchedOn)
                        .assets(bucket)
                        .build());
            }
        }
    }

    /**
     * Merges {@code mergeId} into {@code keepId}: unit counts are combined, every history record
     * (lifecycle actions, location assignments, maintenance tasks, replacement links) is
     * reassigned to the surviving record, and the duplicate is archived rather than hard-deleted
     * so the audit trail survives.
     */
    @Transactional
    public Equipment mergeDuplicates(Long keepId, Long mergeId, String username) {
        if (keepId == null || mergeId == null || keepId.equals(mergeId)) {
            throw new IllegalArgumentException("Two different asset ids are required for a merge");
        }
        Hospital hospital = getHospitalForUser(username);
        Equipment keep = equipmentRepository.findByIdAndHospitalId(keepId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));
        Equipment merge = equipmentRepository.findByIdAndHospitalId(mergeId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));

        int keepQuantity = keep.getQuantity() == null ? 0 : keep.getQuantity();
        int mergeQuantity = merge.getQuantity() == null ? 1 : merge.getQuantity();
        keep.setQuantity(keepQuantity + mergeQuantity);

        reassign("UPDATE equipment_lifecycle_actions SET equipment_id = :keep WHERE equipment_id = :merge",
                keepId, mergeId);
        reassign("UPDATE equipment_location_history SET equipment_id = :keep WHERE equipment_id = :merge",
                keepId, mergeId);
        reassign("UPDATE maintenance_tasks SET equipment_record_id = :keep WHERE equipment_record_id = :merge",
                keepId, mergeId);
        reassign("UPDATE equipment SET replacement_equipment_id = :keep WHERE replacement_equipment_id = :merge",
                keepId, mergeId);
        reassign("UPDATE equipment_lifecycle_actions SET replacement_equipment_id = :keep WHERE replacement_equipment_id = :merge",
                keepId, mergeId);

        equipmentRepository.save(keep);

        merge.setDeleted(true);
        merge.setDeletedAt(LocalDateTime.now());
        merge.setDeletedBy(username);
        equipmentRepository.save(merge);

        return keep;
    }

    private void reassign(String sql, Long keepId, Long mergeId) {
        entityManager.createNativeQuery(sql)
                .setParameter("keep", keepId)
                .setParameter("merge", mergeId)
                .executeUpdate();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}