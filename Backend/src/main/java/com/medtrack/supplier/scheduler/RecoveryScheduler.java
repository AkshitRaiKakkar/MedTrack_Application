package com.medtrack.supplier.scheduler;

import com.medtrack.supplier.recovery.RecoveryEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecoveryScheduler {

    private final RecoveryEngine recoveryEngine;

    // Run every minute
    @Scheduled(fixedDelayString = "${app.supplier.workflow.schedulerCronInterval:60000}")
    public void runRecovery() {
        log.info("Starting scheduled workflow recovery job");
        try {
            recoveryEngine.processPendingOperations();
        } catch (Exception e) {
            log.error("Error during workflow recovery execution", e);
        }
    }
}
