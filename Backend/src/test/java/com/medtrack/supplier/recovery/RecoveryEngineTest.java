package com.medtrack.supplier.recovery;

import com.medtrack.supplier.config.WorkflowConfig;
import com.medtrack.supplier.dto.RecoveryResultDTO;
import com.medtrack.supplier.model.PendingOperation;
import com.medtrack.supplier.repository.PendingOperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

public class RecoveryEngineTest {

    @Mock
    private PendingOperationRepository pendingOperationRepository;

    @Mock
    private WorkflowConfig workflowConfig;

    @InjectMocks
    private RecoveryEngine recoveryEngine;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(workflowConfig.isRecoveryEnabled()).thenReturn(true);
        when(workflowConfig.getMaxRetries()).thenReturn(3);
    }

    @Test
    void testProcessPendingOperationsDisabled() {
        when(workflowConfig.isRecoveryEnabled()).thenReturn(false);

        List<RecoveryResultDTO> results = recoveryEngine.processPendingOperations();

        assertTrue(results.isEmpty());
    }

    @Test
    void testProcessPendingOperationsUnsupportedType() {
        PendingOperation op = PendingOperation.builder()
                .id(1L)
                .operationType("UNKNOWN_TYPE")
                .status("PENDING")
                .targetId(10L)
                .retryCount(0)
                .build();

        when(pendingOperationRepository.findEligibleForRecovery(any(), anyInt())).thenReturn(List.of(op));
        when(workflowConfig.getRetryBackoffMillis()).thenReturn(1000L);

        List<RecoveryResultDTO> results = recoveryEngine.processPendingOperations();

        assertEquals(1, results.size());
        assertEquals(false, results.get(0).isSuccessful());
    }
}
