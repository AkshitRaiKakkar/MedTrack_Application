package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentTimelineEntry;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentLifecycleAction;
import com.medtrack.model.EquipmentLifecycleStatus;
import com.medtrack.model.EquipmentTimelineEventType;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.EquipmentLifecycleActionRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.OperationsEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Per-asset lifecycle timeline (issue #704): one chronological view of everything that has
 * happened to an asset - purchase, location changes, maintenance, repairs, retirements and
 * system alerts - aggregated from records the backend already keeps.
 *
 * <p>No new event capture is required and nothing is written; the endpoint is read-only for
 * every role, which makes it safe to include in printable asset records.</p>
 */
@Service
@RequiredArgsConstructor
public class EquipmentTimelineService {

    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final EquipmentLifecycleActionRepository lifecycleActionRepository;
    private final MaintenanceTaskRepository maintenanceTaskRepository;
    private final OperationsEventRepository operationsEventRepository;

    /**
     * Aggregates every recorded event for one asset into a chronological timeline.
     *
     * @param equipmentId the asset's id
     * @param username    authenticated user's username
     * @return timeline entries, oldest first
     */
    @Transactional(readOnly = true)
    public List<EquipmentTimelineEntry> getTimeline(Long equipmentId, String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(equipmentId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + equipmentId));

        List<EquipmentTimelineEntry> entries = new ArrayList<>();

        // 1. Purchase: the oldest fact about the asset, derived from the registration data.
        if (equipment.getPurchaseDate() != null) {
            entries.add(EquipmentTimelineEntry.builder()
                    .type(EquipmentTimelineEventType.PURCHASED)
                    .title("Purchased")
                    .description(describePurchase(equipment))
                    .date(equipment.getPurchaseDate().atStartOfDay())
                    .actor("System")
                    .source("PURCHASE")
                    .build());
        }

        // 2. Lifecycle actions: assignments, transfers, retirements, disposals, replacements,
        //    depreciation snapshots - each with requester, status and any notes.
        for (EquipmentLifecycleAction action :
                lifecycleActionRepository.findByEquipmentIdAndHospitalIdOrderByRequestedAtDesc(
                        equipmentId, hospital.getId())) {
            entries.add(toLifecycleEntry(action));
        }

        // 3. Maintenance tasks: scheduled work and completed repairs/inspections, with the
        //    technician who carried them out.
        for (MaintenanceTask task :
                maintenanceTaskRepository.findByEquipmentRecord_IdAndHospitalId(
                        equipmentId, hospital.getId())) {
            entries.add(toMaintenanceEntry(task));
        }

        // 4. Operations events: registration, updates, warranty alerts - the audit trail the
        //    platform already records on the equipment feed.
        for (OperationsEvent event : operationsEventRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                        OperationsEvent.EntityType.EQUIPMENT, equipmentId)) {
            entries.add(toOperationsEntry(event));
        }

        entries.sort(Comparator.comparing(EquipmentTimelineEntry::getDate));
        return entries;
    }

    private String describePurchase(Equipment equipment) {
        StringBuilder description = new StringBuilder("Acquired on " + equipment.getPurchaseDate());
        if (equipment.getPurchaseCost() != null) {
            description.append(" for $").append(equipment.getPurchaseCost().setScale(2));
        }
        if (equipment.getWarrantyProvider() != null) {
            description.append("; warranty by ").append(equipment.getWarrantyProvider());
        }
        return description.toString();
    }

    private EquipmentTimelineEntry toLifecycleEntry(EquipmentLifecycleAction action) {
        String title;
        switch (action.getActionType()) {
            case ASSIGNMENT -> title = action.getCustodian() != null
                    ? "Assigned to " + action.getCustodian()
                    : "Assignment";
            case TRANSFER -> title = "Transferred";
            case RETIREMENT -> title = "Retired";
            case DISPOSAL -> title = "Disposed";
            case REPLACEMENT -> title = action.getReplacementEquipment() != null
                    ? "Replaced by " + action.getReplacementEquipment().getEquipmentCode()
                    : "Replaced";
            default -> title = "Depreciation snapshot";
        }

        StringBuilder description = new StringBuilder();
        if (action.getPreviousDepartment() != null || action.getNewDepartment() != null) {
            description.append("Department: ")
                    .append(blankToDash(action.getPreviousDepartment()))
                    .append(" → ")
                    .append(blankToDash(action.getNewDepartment()))
                    .append(". ");
        }
        if (action.getRoomLocation() != null) {
            description.append("Room: ").append(action.getRoomLocation()).append(". ");
        }
        if (action.getWardLocation() != null) {
            description.append("Ward: ").append(action.getWardLocation()).append(". ");
        }
        if (action.getCustodian() != null) {
            description.append("Custodian: ").append(action.getCustodian()).append(". ");
        }
        if (action.getDepreciationAmount() != null) {
            description.append("Depreciation: $")
                    .append(action.getDepreciationAmount().setScale(2)).append(". ");
        }
        if (action.getNotes() != null && !action.getNotes().isBlank()) {
            description.append(action.getNotes());
        }
        if (description.isEmpty()) {
            description.append(action.getActionType().name().replace('_', ' ').toLowerCase());
        }

        return EquipmentTimelineEntry.builder()
                .type(typeForLifecycleAction(action))
                .title(title)
                .description(description.toString().trim())
                .date(actionDate(action))
                .actor(action.getRequestedBy() != null ? action.getRequestedBy() : "System")
                .statusChange("Lifecycle status: " + action.getStatus().name())
                .source("LIFECYCLE")
                .sourceId(action.getId())
                .build();
    }

    private EquipmentTimelineEventType typeForLifecycleAction(EquipmentLifecycleAction action) {
        return switch (action.getActionType()) {
            case ASSIGNMENT -> EquipmentTimelineEventType.ASSIGNED;
            case TRANSFER -> EquipmentTimelineEventType.MOVED;
            case RETIREMENT -> EquipmentTimelineEventType.RETIRED;
            case DISPOSAL -> EquipmentTimelineEventType.DISPOSED;
            case REPLACEMENT -> EquipmentTimelineEventType.REPLACED;
            case DEPRECIATION_SNAPSHOT -> EquipmentTimelineEventType.DEPRECIATION_SNAPSHOT;
        };
    }

    /** The effective date of the action when set, otherwise when it was requested. */
    private LocalDateTime actionDate(EquipmentLifecycleAction action) {
        if (action.getEffectiveDate() != null) {
            return action.getEffectiveDate().atStartOfDay();
        }
        return action.getRequestedAt();
    }

    private EquipmentTimelineEntry toMaintenanceEntry(MaintenanceTask task) {
        boolean completed = task.getStatus() == MaintenanceStatus.COMPLETED;
        String title = completed ? "Maintenance completed"
                : "Maintenance: " + blankToDash(task.getMaintenanceType());

        StringBuilder description = new StringBuilder();
        if (task.getMaintenanceType() != null) {
            description.append("Type: ").append(task.getMaintenanceType()).append(". ");
        }
        if (task.getDescription() != null && !task.getDescription().isBlank()) {
            description.append(task.getDescription()).append(" ");
        }
        if (task.getPartsUsed() != null && !task.getPartsUsed().isBlank()) {
            description.append("Parts: ").append(task.getPartsUsed()).append(". ");
        }
        if (task.getNotes() != null && !task.getNotes().isBlank()) {
            description.append(task.getNotes());
        }
        if (description.isEmpty()) {
            description.append("No further details recorded.");
        }

        LocalDateTime date = completed && task.getCompletedAt() != null
                ? task.getCompletedAt()
                : task.getDeadline() != null ? task.getDeadline().atStartOfDay() : task.getCreatedAt();

        return EquipmentTimelineEntry.builder()
                .type(completed ? EquipmentTimelineEventType.MAINTENANCE_COMPLETED
                        : EquipmentTimelineEventType.MAINTENANCE_SCHEDULED)
                .title(title)
                .description(description.toString().trim())
                .date(date)
                .actor(task.getAssignedTechnician() != null ? task.getAssignedTechnician() : "System")
                .statusChange("Maintenance status: " + task.getStatus().name())
                .source("MAINTENANCE")
                .sourceId(task.getId())
                .build();
    }

    private EquipmentTimelineEntry toOperationsEntry(OperationsEvent event) {
        EquipmentTimelineEventType type = switch (event.getType()) {
            case EQUIPMENT_CREATED -> EquipmentTimelineEventType.REGISTERED;
            case EQUIPMENT_WARRANTY_EXPIRING -> EquipmentTimelineEventType.WARRANTY_ALERT;
            case EQUIPMENT_UPDATED, EQUIPMENT_ARCHIVED, EQUIPMENT_LOW_STOCK ->
                    EquipmentTimelineEventType.STATUS_CHANGED;
            default -> EquipmentTimelineEventType.OTHER;
        };

        String title = switch (event.getType()) {
            case EQUIPMENT_CREATED -> "Registered in inventory";
            case EQUIPMENT_WARRANTY_EXPIRING -> "Warranty expiry alert";
            case EQUIPMENT_UPDATED -> "Record updated";
            case EQUIPMENT_ARCHIVED -> "Archived";
            case EQUIPMENT_LOW_STOCK -> "Low stock warning";
            default -> event.getTitle();
        };

        return EquipmentTimelineEntry.builder()
                .type(type)
                .title(title)
                .description(event.getTitle() != null && !event.getTitle().equals(title)
                        ? event.getTitle() + " — " + blankToDash(event.getDetail())
                        : blankToDash(event.getDetail()))
                .date(event.getCreatedAt())
                .actor(event.getActor() != null ? event.getActor() : "System")
                .statusChange(null)
                .source("OPERATIONS")
                .sourceId(event.getId())
                .build();
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

    private String blankToDash(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }
}
