package com.medtrack.service;

import com.medtrack.model.Hospital;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Scheduled driver for SLA state recomputation and alerting.
 *
 * <p>Before this scheduler existed, {@link PreventiveMaintenanceService#refreshSla} only ran when
 * a hospital user opened the SLA dashboard, so a task could sit breached for days with nobody
 * notified if no one happened to load that page. This runs the same recomputation across every
 * hospital on a timer and publishes {@code SLA_WARNING}/{@code SLA_BREACHED}/{@code SLA_ESCALATED}
 * and {@code MAINTENANCE_OVERDUE} operations events on each state transition (see
 * {@code publishSlaTransitionEvent}), so the Activity Center reflects overdue work proactively.</p>
 */
@Service
@RequiredArgsConstructor
public class MaintenanceSlaAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceSlaAlertScheduler.class);

    private final HospitalRepository hospitalRepository;
    private final PreventiveMaintenanceService preventiveMaintenanceService;

    /**
     * Runs hourly by default (configurable via {@code app.maintenance.sla.alert.cron}).
     */
    @Scheduled(cron = "${app.maintenance.sla.alert.cron:0 0 * * * *}")
    public void runSlaSweep() {
        log.debug("Running scheduled SLA sweep...");
        List<Hospital> hospitals = hospitalRepository.findAll();
        int processed = 0;

        for (Hospital hospital : hospitals) {
            try {
                preventiveMaintenanceService.refreshSlaForHospitalId(hospital.getId());
                processed++;
            } catch (RuntimeException exception) {
                log.warn("Scheduled SLA sweep failed for hospital {}: {}", hospital.getId(), exception.getMessage());
            }
        }

        log.info("SLA sweep processed {} of {} hospitals", processed, hospitals.size());
    }
}
