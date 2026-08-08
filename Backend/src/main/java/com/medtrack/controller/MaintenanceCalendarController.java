package com.medtrack.controller;

import com.medtrack.dto.MaintenanceCalendarResponse;
import com.medtrack.dto.MaintenanceScheduleRequest;
import com.medtrack.dto.MaintenanceScheduleResponse;
import com.medtrack.dto.OverdueMaintenanceResponse;
import com.medtrack.dto.UpcomingMaintenanceResponse;
import com.medtrack.service.MaintenanceCalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceCalendarController {

    private final MaintenanceCalendarService maintenanceCalendarService;

    @GetMapping("/calendar")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceCalendarResponse> getCalendar(
            Principal principal
    ) {

        return ResponseEntity.ok(
                maintenanceCalendarService.getCalendar(
                        principal.getName()
                )
        );

    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<UpcomingMaintenanceResponse>> getUpcoming(
            Principal principal
    ) {

        return ResponseEntity.ok(
                maintenanceCalendarService.getUpcoming(
                        principal.getName()
                )
        );

    }

    @GetMapping("/overdue")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<List<OverdueMaintenanceResponse>> getOverdue(
            Principal principal
    ) {

        return ResponseEntity.ok(
                maintenanceCalendarService.getOverdue(
                        principal.getName()
                )
        );

    }

    @PostMapping("/schedule")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceScheduleResponse> createSchedule(
            @RequestBody MaintenanceScheduleRequest request,
            Principal principal
    ) {

        return ResponseEntity.ok(
                maintenanceCalendarService.createSchedule(
                        request,
                        principal.getName()
                )
        );

    }

}