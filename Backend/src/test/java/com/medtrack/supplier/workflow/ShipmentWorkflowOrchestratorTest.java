package com.medtrack.supplier.workflow;

import com.medtrack.supplier.model.PendingOperation;
import com.medtrack.supplier.repository.PendingOperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ShipmentWorkflowOrchestratorTest {

    @Mock
    private PendingOperationRepository pendingOperationRepository;

    @Mock
    private WorkflowValidator workflowValidator;

    @InjectMocks
    private ShipmentWorkflowOrchestrator orchestrator;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegisterPendingOperationCreatesNew() {
        when(pendingOperationRepository.findByTargetIdAndOperationTypeAndStatus(1L, "EVENT_PUBLISH", "PENDING"))
                .thenReturn(Optional.empty());

        orchestrator.registerPendingOperation(1L, "EVENT_PUBLISH", "{}", "error");

        verify(pendingOperationRepository, times(1)).save(any(PendingOperation.class));
    }

    @Test
    void testMarkOperationSuccessful() {
        PendingOperation op = new PendingOperation();
        when(pendingOperationRepository.findByTargetIdAndOperationTypeAndStatus(1L, "EVENT_PUBLISH", "PENDING"))
                .thenReturn(Optional.of(op));

        orchestrator.markOperationSuccessful(1L, "EVENT_PUBLISH");

        verify(pendingOperationRepository, times(1)).save(argThat(p -> "RECOVERED".equals(p.getStatus())));
    }
}
