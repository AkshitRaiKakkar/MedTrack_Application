package com.medtrack.controller;

import com.medtrack.model.MaintenanceTask;
import com.medtrack.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing REST endpoints for managing equipment maintenance workflows.
 * Mapped under "/api/maintenance" to schedule, track, and update maintenance requests.
 */
@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    /**
     * Retrieves a list of all maintenance tasks registered in the platform.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('HOSPITAL', 'TECHNICIAN')")
    public ResponseEntity<List<MaintenanceTask>> getAllTasks(Authentication authentication) {
        // Forward the trusted identity so the service can enforce record ownership.
        List<MaintenanceTask> tasks = maintenanceService.getAllTasks(authentication);

        if (tasks.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(tasks);
    }

    /**
     * Resolves a single maintenance task by its unique database identifier.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOSPITAL', 'TECHNICIAN')")
    public ResponseEntity<MaintenanceTask> getTaskById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(maintenanceService.getTaskById(id, authentication));
    }

    /**
     * Schedules a new maintenance task for a piece of equipment.
     * Restricted to authenticated users holding the 'HOSPITAL' role authority.
     */
    @PostMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceTask> scheduleTask(@RequestBody MaintenanceTask task,
                                                        Authentication authentication) {
        MaintenanceTask createdTask = maintenanceService.scheduleTask(task, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
    }

    /**
     * Updates an existing maintenance task's status or details.
     * Restricted to authenticated users holding the 'TECHNICIAN' role authority.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<MaintenanceTask> updateTask(@PathVariable Long id,
                                                      @RequestBody MaintenanceTask task,
                                                      Authentication authentication) {
        return ResponseEntity.ok(maintenanceService.updateTask(id, task, authentication));
    }

    /**
     * Removes a scheduled maintenance task from the database.
     * Restricted to authenticated users holding the 'HOSPITAL' role authority.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, Authentication authentication) {
        maintenanceService.deleteTask(id, authentication);
        return ResponseEntity.noContent().build();
    }
}
