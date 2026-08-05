package com.medtrack.service;

import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled driver for the preventive-maintenance automation engine.
 *
 * <p>Runs the generation job across every hospital daily. Generation itself is idempotent per
 * rule/window, so the job is safe to run repeatedly and a crash between runs cannot create
 * duplicates.</p>
 */
@Service
@RequiredArgsConstructor
public class PreventiveMaintenanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(PreventiveMaintenanceScheduler.class);

    private final MaintenancePolicyRuleRepository ruleRepository;
    private final HospitalRepository hospitalRepository;
    private final PreventiveMaintenanceService preventiveMaintenanceService;

    /**
     * Runs daily at 02:30 server-local time. Every active rule of every hospital is generated for
     * its configured lead-time window.
     *
     * <p>Not transactional on purpose: {@code generateTasksForScheduler} is itself transactional, so
     * each rule run commits independently and a single failed rule cannot poison the whole batch.</p>
     */
    @Scheduled(cron = "${app.maintenance.automation.cron:0 30 2 * * *}")
    public void runScheduledGeneration() {
        log.debug("Running scheduled preventive-maintenance generation...");
        LocalDate start = LocalDate.now();
        int hospitalsProcessed = 0;
        int runsCreated = 0;

        List<Hospital> hospitals = hospitalRepository.findAll();
        for (Hospital hospital : hospitals) {
            List<MaintenancePolicyRule> rules = ruleRepository
                    .findByHospitalIdAndActiveTrue(hospital.getId());
            if (rules.isEmpty()) {
                continue;
            }
            for (MaintenancePolicyRule rule : rules) {
                try {
                    LocalDate end = start.plusDays(rule.getLeadTimeDays() != null
                            ? rule.getLeadTimeDays() : 7);
                    preventiveMaintenanceService.generateTasksForScheduler(rule.getId(), start, end);
                    runsCreated++;
                } catch (RuntimeException exception) {
                    log.warn("Scheduled generation failed for rule {} of hospital {}: {}",
                            rule.getId(), hospital.getId(), exception.getMessage());
                }
            }
            hospitalsProcessed++;
        }

        log.info("Scheduled generation processed {} hospitals and {} rule runs", hospitalsProcessed, runsCreated);
    }
}
