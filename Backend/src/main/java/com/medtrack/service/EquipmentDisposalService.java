package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.DataSanitizationRequest;
import com.medtrack.dto.EquipmentDisposalRequest;
import com.medtrack.dto.EquipmentDisposalResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentDisposal;
import com.medtrack.model.EquipmentDisposalStatus;
import com.medtrack.model.EquipmentLifecycleAction;
import com.medtrack.model.EquipmentLifecycleActionType;
import com.medtrack.model.EquipmentLifecycleStatus;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentDisposalRepository;
import com.medtrack.repository.EquipmentLifecycleActionRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.util.DisposalCertificatePdf;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

/**
 * Decommissioning / disposal workflow (issue #744).
 *
 * <p>Assets are retired through a documented chain, never by silent deletion: a staff member
 * records the disposal method and reason, a manager approves it, devices that stored patient or
 * operational data need a confirmed data-sanitisation step, and completion moves the asset to
 * {@link EquipmentStatus#DISPOSED}, mints a certificate number and mirrors the event into the
 * lifecycle timeline so the full history stays preserved and searchable.</p>
 */
@Service
@RequiredArgsConstructor
public class EquipmentDisposalService {

    private static final List<EquipmentStatus> RETIRED_STATUSES =
            List.of(EquipmentStatus.RETIRED, EquipmentStatus.DISPOSED);

    private final EquipmentDisposalRepository disposalRepository;
    private final EquipmentLifecycleActionRepository lifecycleRepository;
    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final DisposalCertificatePdf certificatePdf;

    /**
     * Opens a decommissioning request for one asset. The asset must still be active, and no other
     * request may already be awaiting approval or approved for it.
     */
    @Transactional
    public EquipmentDisposalResponse requestDisposal(Long equipmentId,
                                                     EquipmentDisposalRequest request,
                                                     String username) {
        if (request == null || request.getDisposalMethod() == null) {
            throw new IllegalArgumentException("Disposal method is required");
        }
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = getOwnedEquipment(equipmentId, hospital.getId());

        if (isRetired(equipment)) {
            throw new IllegalArgumentException("Retired or disposed equipment cannot be decommissioned again");
        }
        boolean alreadyActive = disposalRepository
                .findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(equipmentId, hospital.getId())
                .stream()
                .anyMatch(disposal -> disposal.getStatus() == EquipmentDisposalStatus.PENDING_APPROVAL
                        || disposal.getStatus() == EquipmentDisposalStatus.APPROVED);
        if (alreadyActive) {
            throw new IllegalArgumentException("This asset already has a disposal request awaiting approval");
        }

        EquipmentDisposal disposal = EquipmentDisposal.builder()
                .equipment(equipment)
                .hospital(hospital)
                .disposalMethod(request.getDisposalMethod())
                .disposalReason(trimToNull(request.getDisposalReason()))
                .effectiveDate(request.getEffectiveDate() != null ? request.getEffectiveDate() : LocalDate.now())
                .storesPatientData(Boolean.TRUE.equals(request.getStoresPatientData()))
                .dataSanitizationDetails(trimToNull(request.getDataSanitizationDetails()))
                .status(EquipmentDisposalStatus.PENDING_APPROVAL)
                .notes(trimToNull(request.getNotes()))
                .requestedBy(username)
                .build();
        return EquipmentDisposalResponse.from(disposalRepository.save(disposal));
    }

    /** Disposals still awaiting manager approval for the caller's hospital, newest first. */
    public List<EquipmentDisposalResponse> getPendingDisposals(String username) {
        Hospital hospital = getHospitalForUser(username);
        return disposalRepository
                .findByHospitalIdAndStatusOrderByRequestedAtDesc(
                        hospital.getId(), EquipmentDisposalStatus.PENDING_APPROVAL)
                .stream()
                .map(EquipmentDisposalResponse::from)
                .toList();
    }

    /** Every disposal record for the caller's hospital, newest first. */
    public List<EquipmentDisposalResponse> getDisposalHistory(String username) {
        Hospital hospital = getHospitalForUser(username);
        return disposalRepository.findByHospitalIdOrderByRequestedAtDesc(hospital.getId())
                .stream()
                .map(EquipmentDisposalResponse::from)
                .toList();
    }

    /** Disposal records for a single asset. */
    public List<EquipmentDisposalResponse> getDisposalsForEquipment(Long equipmentId, String username) {
        Hospital hospital = getHospitalForUser(username);
        getOwnedEquipment(equipmentId, hospital.getId());
        return disposalRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(equipmentId, hospital.getId())
                .stream()
                .map(EquipmentDisposalResponse::from)
                .toList();
    }

    @Transactional
    public EquipmentDisposalResponse approveDisposal(Long disposalId, String username) {
        EquipmentDisposal disposal = getOwnedDisposal(disposalId, username);
        requireStatus(disposal, EquipmentDisposalStatus.PENDING_APPROVAL);
        disposal.setStatus(EquipmentDisposalStatus.APPROVED);
        disposal.setApprovedBy(username);
        disposal.setApprovedAt(LocalDateTime.now());
        return EquipmentDisposalResponse.from(disposalRepository.save(disposal));
    }

    @Transactional
    public EquipmentDisposalResponse rejectDisposal(Long disposalId, String reason, String username) {
        EquipmentDisposal disposal = getOwnedDisposal(disposalId, username);
        requireStatus(disposal, EquipmentDisposalStatus.PENDING_APPROVAL);
        disposal.setStatus(EquipmentDisposalStatus.REJECTED);
        disposal.setRejectedBy(username);
        disposal.setRejectedReason(trimToNull(reason));
        disposal.setRejectedAt(LocalDateTime.now());
        return EquipmentDisposalResponse.from(disposalRepository.save(disposal));
    }

    @Transactional
    public EquipmentDisposalResponse cancelDisposal(Long disposalId, String username) {
        EquipmentDisposal disposal = getOwnedDisposal(disposalId, username);
        requireStatus(disposal, EquipmentDisposalStatus.PENDING_APPROVAL);
        disposal.setStatus(EquipmentDisposalStatus.CANCELLED);
        disposal.setCancelledBy(username);
        disposal.setCancelledAt(LocalDateTime.now());
        return EquipmentDisposalResponse.from(disposalRepository.save(disposal));
    }

    /**
     * Records the data-sanitisation confirmation for an approved disposal. Only required for
     * devices flagged as storing patient or operational data, but any device may be confirmed.
     * The acting user and timestamp are stamped for the audit trail.
     */
    @Transactional
    public EquipmentDisposalResponse recordDataSanitization(Long disposalId,
                                                            DataSanitizationRequest request,
                                                            String username) {
        EquipmentDisposal disposal = getOwnedDisposal(disposalId, username);
        requireStatus(disposal, EquipmentDisposalStatus.APPROVED);
        disposal.setDataSanitizationConfirmed(true);
        if (request != null) {
            disposal.setDataSanitizationDetails(trimToNull(request.getDetails()));
        }
        disposal.setDataSanitizedBy(username);
        disposal.setDataSanitizedAt(LocalDateTime.now());
        return EquipmentDisposalResponse.from(disposalRepository.save(disposal));
    }

    /**
     * Completes an approved disposal: the asset moves to {@link EquipmentStatus#DISPOSED}, a
     * certificate number is minted and the event is mirrored into the lifecycle timeline so the
     * asset's history remains complete. Devices that stored patient or operational data must have
     * their data-sanitisation confirmation on file first.
     */
    @Transactional
    public EquipmentDisposalResponse completeDisposal(Long disposalId, String username) {
        EquipmentDisposal disposal = getOwnedDisposal(disposalId, username);
        requireStatus(disposal, EquipmentDisposalStatus.APPROVED);
        if (Boolean.TRUE.equals(disposal.getStoresPatientData())
                && !Boolean.TRUE.equals(disposal.getDataSanitizationConfirmed())) {
            throw new IllegalArgumentException(
                    "Data sanitisation must be confirmed before this asset can be decommissioned");
        }

        Equipment equipment = disposal.getEquipment();
        equipment.setStatus(EquipmentStatus.DISPOSED);
        equipmentRepository.save(equipment);

        disposal.setStatus(EquipmentDisposalStatus.COMPLETED);
        disposal.setCompletedBy(username);
        disposal.setCompletedAt(LocalDateTime.now());

        EquipmentDisposal saved = disposalRepository.save(disposal);
        saved.setCertificateNumber("DSP-" + Year.now() + "-" + String.format("%06d", saved.getId()));
        saved = disposalRepository.save(saved);

        mirrorIntoTimeline(saved, username);
        return EquipmentDisposalResponse.from(saved);
    }

    /**
     * The PDF certificate of disposal. Only available once the disposal has been completed and a
     * certificate number exists.
     */
    @Transactional(readOnly = true)
    public byte[] generateCertificate(Long disposalId, String username) {
        EquipmentDisposal disposal = getOwnedDisposal(disposalId, username);
        if (disposal.getStatus() != EquipmentDisposalStatus.COMPLETED
                || disposal.getCertificateNumber() == null) {
            throw new IllegalStateException(
                    "The certificate of disposal is available once the disposal is completed");
        }
        return certificatePdf.generate(disposal);
    }

    /**
     * Retired and disposed assets for the caller's hospital, paged - the "retired view" the
     * workflow produces. Records are never hard deleted, so the full history is preserved.
     */
    public Page<Equipment> getRetiredEquipment(String username, Pageable pageable) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findByHospitalIdAndStatusIn(hospital.getId(), RETIRED_STATUSES, pageable);
    }

    private void mirrorIntoTimeline(EquipmentDisposal disposal, String username) {
        EquipmentLifecycleAction action = EquipmentLifecycleAction.builder()
                .equipment(disposal.getEquipment())
                .hospital(disposal.getHospital())
                .actionType(EquipmentLifecycleActionType.DISPOSAL)
                .status(EquipmentLifecycleStatus.COMPLETED)
                .effectiveDate(disposal.getEffectiveDate())
                .notes(composeTimelineNotes(disposal))
                .requestedBy(disposal.getRequestedBy())
                .approvedBy(disposal.getApprovedBy())
                .completedBy(username)
                .requestedAt(disposal.getRequestedAt())
                .approvedAt(disposal.getApprovedAt())
                .completedAt(disposal.getCompletedAt())
                .build();
        lifecycleRepository.save(action);
    }

    private String composeTimelineNotes(EquipmentDisposal disposal) {
        StringBuilder notes = new StringBuilder("Disposal certificate " + disposal.getCertificateNumber());
        notes.append("; method: ").append(disposal.getDisposalMethod().name().replace('_', ' ').toLowerCase());
        if (disposal.getDisposalReason() != null && !disposal.getDisposalReason().isBlank()) {
            notes.append("; reason: ").append(disposal.getDisposalReason());
        }
        if (Boolean.TRUE.equals(disposal.getStoresPatientData())) {
            notes.append("; data sanitisation confirmed by ").append(disposal.getDataSanitizedBy());
        }
        return notes.toString();
    }

    private boolean isRetired(Equipment equipment) {
        return equipment.getStatus() == EquipmentStatus.RETIRED
                || equipment.getStatus() == EquipmentStatus.DISPOSED;
    }

    private void requireStatus(EquipmentDisposal disposal, EquipmentDisposalStatus expected) {
        if (disposal.getStatus() != expected) {
            throw new IllegalArgumentException(
                    "Disposal must be " + expected + " to continue, but is " + disposal.getStatus());
        }
    }

    private EquipmentDisposal getOwnedDisposal(Long disposalId, String username) {
        Hospital hospital = getHospitalForUser(username);
        return disposalRepository.findByIdAndHospitalId(disposalId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Disposal record not found or you don't have access"));
    }

    private Equipment getOwnedEquipment(Long equipmentId, Long hospitalId) {
        return equipmentRepository.findByIdAndHospitalId(equipmentId, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment not found or you don't have access"));
    }

    private Hospital getHospitalForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user"));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
