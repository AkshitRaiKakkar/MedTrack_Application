package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentDepreciationSummaryResponse;
import com.medtrack.dto.EquipmentLifecycleActionRequest;
import com.medtrack.dto.EquipmentLifecycleActionResponse;
import com.medtrack.dto.EquipmentLocationResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentLifecycleAction;
import com.medtrack.model.EquipmentLifecycleActionType;
import com.medtrack.model.EquipmentLifecycleStatus;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentLifecycleActionRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EquipmentLifecycleService {

    private final EquipmentLifecycleActionRepository lifecycleRepository;
    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    @Transactional
    public EquipmentLifecycleActionResponse createAction(Long equipmentId,
                                                         EquipmentLifecycleActionRequest request,
                                                         String username) {
        if (request == null || request.getActionType() == null) {
            throw new IllegalArgumentException("Lifecycle action type is required");
        }
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = getOwnedEquipment(equipmentId, hospital.getId());
        validateActionRequest(equipment, request);

        Equipment replacement = null;
        if (request.getReplacementEquipmentId() != null) {
            replacement = getOwnedEquipment(request.getReplacementEquipmentId(), hospital.getId());
            if (replacement.getId().equals(equipment.getId())) {
                throw new IllegalArgumentException("Replacement equipment must be a different asset");
            }
        }

        EquipmentLifecycleAction action = EquipmentLifecycleAction.builder()
                .equipment(equipment)
                .hospital(hospital)
                .actionType(request.getActionType())
                .status(EquipmentLifecycleStatus.PENDING_APPROVAL)
                .previousDepartment(equipment.getDepartment())
                .newDepartment(trimToNull(request.getNewDepartment()))
                .roomLocation(trimToNull(request.getRoomLocation()))
                .wardLocation(trimToNull(request.getWardLocation()))
                .custodian(trimToNull(request.getCustodian()))
                .effectiveDate(request.getEffectiveDate() != null ? request.getEffectiveDate() : LocalDate.now())
                .replacementEquipment(replacement)
                .depreciationAmount(request.getDepreciationAmount())
                .notes(trimToNull(request.getNotes()))
                .requestedBy(username)
                .build();
        return EquipmentLifecycleActionResponse.from(lifecycleRepository.save(action));
    }

    public List<EquipmentLifecycleActionResponse> getTimeline(Long equipmentId, String username) {
        Hospital hospital = getHospitalForUser(username);
        getOwnedEquipment(equipmentId, hospital.getId());
        return lifecycleRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(equipmentId, hospital.getId())
                .stream()
                .map(EquipmentLifecycleActionResponse::from)
                .toList();
    }

    public List<EquipmentLifecycleActionResponse> getPendingActions(String username) {
        Hospital hospital = getHospitalForUser(username);
        return lifecycleRepository.findByHospitalIdAndStatusOrderByRequestedAtDesc(
                        hospital.getId(), EquipmentLifecycleStatus.PENDING_APPROVAL)
                .stream()
                .map(EquipmentLifecycleActionResponse::from)
                .toList();
    }

    public EquipmentLocationResponse getCurrentLocation(Long equipmentId, String username) {
        Hospital hospital = getHospitalForUser(username);
        return EquipmentLocationResponse.from(getOwnedEquipment(equipmentId, hospital.getId()));
    }

    public EquipmentDepreciationSummaryResponse getDepreciationSummary(Long equipmentId, String username) {
        Hospital hospital = getHospitalForUser(username);
        getOwnedEquipment(equipmentId, hospital.getId());
        List<EquipmentLifecycleAction> snapshots = lifecycleRepository
                .findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(equipmentId, hospital.getId())
                .stream()
                .filter(action -> action.getActionType() == EquipmentLifecycleActionType.DEPRECIATION_SNAPSHOT)
                .filter(action -> action.getDepreciationAmount() != null)
                .toList();

        BigDecimal total = snapshots.stream()
                .map(EquipmentLifecycleAction::getDepreciationAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal latest = snapshots.isEmpty() ? BigDecimal.ZERO : snapshots.get(0).getDepreciationAmount();

        return EquipmentDepreciationSummaryResponse.builder()
                .equipmentId(equipmentId)
                .latestDepreciationAmount(latest)
                .totalDepreciationRecorded(total)
                .snapshotCount(snapshots.size())
                .build();
    }

    public List<EquipmentLifecycleActionResponse> getReplacementChain(Long equipmentId, String username) {
        Hospital hospital = getHospitalForUser(username);
        getOwnedEquipment(equipmentId, hospital.getId());
        List<EquipmentLifecycleActionResponse> chain = new ArrayList<>();
        Long currentId = equipmentId;
        Set<Long> visited = new HashSet<>();
        while (currentId != null && visited.add(currentId)) {
            EquipmentLifecycleAction next = lifecycleRepository
                    .findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(currentId, hospital.getId())
                    .stream()
                    .filter(action -> action.getActionType() == EquipmentLifecycleActionType.REPLACEMENT)
                    .filter(action -> action.getStatus() == EquipmentLifecycleStatus.COMPLETED)
                    .filter(action -> action.getReplacementEquipment() != null)
                    .findFirst()
                    .orElse(null);
            if (next == null) {
                currentId = null;
            } else {
                chain.add(EquipmentLifecycleActionResponse.from(next));
                currentId = next.getReplacementEquipment().getId();
            }
        }
        return chain;
    }

    @Transactional
    public EquipmentLifecycleActionResponse approveAction(Long actionId, String username) {
        EquipmentLifecycleAction action = getOwnedAction(actionId, username);
        requireStatus(action, EquipmentLifecycleStatus.PENDING_APPROVAL);
        action.setStatus(EquipmentLifecycleStatus.APPROVED);
        action.setApprovedBy(username);
        action.setApprovedAt(LocalDateTime.now());
        return EquipmentLifecycleActionResponse.from(lifecycleRepository.save(action));
    }

    @Transactional
    public EquipmentLifecycleActionResponse rejectAction(Long actionId, String reason, String username) {
        EquipmentLifecycleAction action = getOwnedAction(actionId, username);
        requireStatus(action, EquipmentLifecycleStatus.PENDING_APPROVAL);
        action.setStatus(EquipmentLifecycleStatus.REJECTED);
        action.setRejectedBy(username);
        action.setRejectedReason(trimToNull(reason));
        action.setRejectedAt(LocalDateTime.now());
        return EquipmentLifecycleActionResponse.from(lifecycleRepository.save(action));
    }

    @Transactional
    public EquipmentLifecycleActionResponse cancelAction(Long actionId, String username) {
        EquipmentLifecycleAction action = getOwnedAction(actionId, username);
        requireStatus(action, EquipmentLifecycleStatus.PENDING_APPROVAL);
        action.setStatus(EquipmentLifecycleStatus.CANCELLED);
        action.setCancelledBy(username);
        action.setCancelledAt(LocalDateTime.now());
        return EquipmentLifecycleActionResponse.from(lifecycleRepository.save(action));
    }

    @Transactional
    public EquipmentLifecycleActionResponse completeAction(Long actionId, String username) {
        EquipmentLifecycleAction action = getOwnedAction(actionId, username);
        requireStatus(action, EquipmentLifecycleStatus.APPROVED);
        Equipment equipment = action.getEquipment();
        if (isInactive(equipment) && action.getActionType() != EquipmentLifecycleActionType.DEPRECIATION_SNAPSHOT) {
            throw new IllegalArgumentException("Retired or disposed equipment cannot receive lifecycle changes");
        }

        applyCompletedAction(equipment, action);
        action.setStatus(EquipmentLifecycleStatus.COMPLETED);
        action.setCompletedBy(username);
        action.setCompletedAt(LocalDateTime.now());
        equipmentRepository.save(equipment);
        return EquipmentLifecycleActionResponse.from(lifecycleRepository.save(action));
    }

    private void applyCompletedAction(Equipment equipment, EquipmentLifecycleAction action) {
        if (action.getActionType() == EquipmentLifecycleActionType.TRANSFER
                || action.getActionType() == EquipmentLifecycleActionType.ASSIGNMENT) {
            if (action.getNewDepartment() != null) {
                equipment.setDepartment(action.getNewDepartment());
            }
            equipment.setRoomLocation(action.getRoomLocation());
            equipment.setWardLocation(action.getWardLocation());
            equipment.setCustodian(action.getCustodian());
            equipment.setLocationEffectiveDate(action.getEffectiveDate());
        } else if (action.getActionType() == EquipmentLifecycleActionType.RETIREMENT) {
            equipment.setStatus(EquipmentStatus.RETIRED);
        } else if (action.getActionType() == EquipmentLifecycleActionType.DISPOSAL) {
            equipment.setStatus(EquipmentStatus.DISPOSED);
        } else if (action.getActionType() == EquipmentLifecycleActionType.REPLACEMENT) {
            if (action.getReplacementEquipment() == null) {
                throw new IllegalArgumentException("Replacement equipment is required");
            }
            equipment.setReplacementEquipment(action.getReplacementEquipment());
            equipment.setStatus(EquipmentStatus.RETIRED);
        }
    }

    private void validateActionRequest(Equipment equipment, EquipmentLifecycleActionRequest request) {
        if (isInactive(equipment) && request.getActionType() != EquipmentLifecycleActionType.DEPRECIATION_SNAPSHOT) {
            throw new IllegalArgumentException("Retired or disposed equipment cannot receive lifecycle changes");
        }
        if ((request.getActionType() == EquipmentLifecycleActionType.TRANSFER
                || request.getActionType() == EquipmentLifecycleActionType.ASSIGNMENT)
                && trimToNull(request.getNewDepartment()) == null) {
            throw new IllegalArgumentException("New department is required for transfer or assignment actions");
        }
        if (request.getActionType() == EquipmentLifecycleActionType.REPLACEMENT
                && request.getReplacementEquipmentId() == null) {
            throw new IllegalArgumentException("Replacement equipment is required");
        }
        if (request.getActionType() == EquipmentLifecycleActionType.DEPRECIATION_SNAPSHOT
                && request.getDepreciationAmount() == null) {
            throw new IllegalArgumentException("Depreciation amount is required");
        }
        if (request.getDepreciationAmount() != null && request.getDepreciationAmount().signum() < 0) {
            throw new IllegalArgumentException("Depreciation amount cannot be negative");
        }
    }

    private boolean isInactive(Equipment equipment) {
        return equipment.getStatus() == EquipmentStatus.RETIRED
                || equipment.getStatus() == EquipmentStatus.DISPOSED;
    }

    private void requireStatus(EquipmentLifecycleAction action, EquipmentLifecycleStatus expected) {
        if (action.getStatus() != expected) {
            throw new IllegalArgumentException("Lifecycle action must be " + expected + " to continue");
        }
    }

    private EquipmentLifecycleAction getOwnedAction(Long actionId, String username) {
        Hospital hospital = getHospitalForUser(username);
        return lifecycleRepository.findByIdAndHospitalId(actionId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Lifecycle action not found or access denied"));
    }

    private Equipment getOwnedEquipment(Long equipmentId, Long hospitalId) {
        return equipmentRepository.findByIdAndHospitalId(equipmentId, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));
    }

    private Hospital getHospitalForUser(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username or email is required");
        }
        String identifier = username.trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase(java.util.Locale.ROOT)))
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
