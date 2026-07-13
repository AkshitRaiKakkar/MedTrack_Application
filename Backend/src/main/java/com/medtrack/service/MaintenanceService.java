package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import com.medtrack.exception.ResourceNotFoundException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    public List<MaintenanceTask> getAllTasks(Authentication authentication) {
        // Scope lists from the trusted JWT identity instead of a client-supplied filter.
        if (hasRole(authentication, "HOSPITAL")) {
            return taskRepository.findByHospitalId(getHospitalForUser(authentication.getName()).getId());
        }
        if (hasRole(authentication, "TECHNICIAN")) {
            return taskRepository.findByAssignedTechnician(authentication.getName());
        }
        throw new AccessDeniedException("This role cannot access maintenance tasks");
    }

    public MaintenanceTask getTaskById(Long id, Authentication authentication) {
        return findOwnedTask(id, authentication);
    }

    public MaintenanceTask scheduleTask(MaintenanceTask task, Authentication authentication) {
        Hospital hospital = getHospitalForUser(authentication.getName());

        // Derive ownership on the server; request JSON cannot select another hospital.
        task.setHospitalId(hospital.getId());
        task.setHospital(hospital.getName());
        if (task.getTaskCode() == null) {
            task.setTaskCode("MNT-" + java.util.UUID.randomUUID().toString());
        }
        return taskRepository.save(task);
    }

    public MaintenanceTask updateTask(Long id, MaintenanceTask taskDetails, Authentication authentication) {
        // A technician can update only a task explicitly assigned to their login email.
        MaintenanceTask task = taskRepository.findByIdAndAssignedTechnician(id, authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance task not found or not assigned to you"));

        task.setStatus(taskDetails.getStatus());
        task.setNotes(taskDetails.getNotes());
        task.setHoursWorked(taskDetails.getHoursWorked());

        return taskRepository.save(task);
    }

    public void deleteTask(Long id, Authentication authentication) {
        // Hospital deletion is ownership-scoped to stop cross-hospital ID access.
        MaintenanceTask task = taskRepository.findByIdAndHospitalId(
                        id, getHospitalForUser(authentication.getName()).getId())
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance task not found or access denied"));
        taskRepository.delete(task);
    }

    private MaintenanceTask findOwnedTask(Long id, Authentication authentication) {
        if (hasRole(authentication, "HOSPITAL")) {
            return taskRepository.findByIdAndHospitalId(id, getHospitalForUser(authentication.getName()).getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Maintenance task not found or access denied"));
        }
        if (hasRole(authentication, "TECHNICIAN")) {
            return taskRepository.findByIdAndAssignedTechnician(id, authentication.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Maintenance task not found or not assigned to you"));
        }
        throw new AccessDeniedException("This role cannot access maintenance tasks");
    }

    private Hospital getHospitalForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }
}
