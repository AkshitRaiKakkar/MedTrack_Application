package com.medtrack.supplier.service;

import com.medtrack.supplier.model.SupplierAuditLog;
import com.medtrack.supplier.repository.SupplierAuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SupplierAuditLogServiceTest {

    @Mock
    private SupplierAuditLogRepository auditLogRepository;

    @InjectMocks
    private SupplierAuditLogService auditLogService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testLogAction_Success() {
        when(auditLogRepository.save(any(SupplierAuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        auditLogService.logAction(1L, 100L, "STATUS_UPDATE", "Status changed", "test_user");

        ArgumentCaptor<SupplierAuditLog> captor = ArgumentCaptor.forClass(SupplierAuditLog.class);
        verify(auditLogRepository, times(1)).save(captor.capture());

        SupplierAuditLog savedLog = captor.getValue();
        assertNotNull(savedLog);
        assertEquals(1L, savedLog.getOrderId());
        assertEquals(100L, savedLog.getSupplierId());
        assertEquals("STATUS_UPDATE", savedLog.getAction());
        assertEquals("Status changed", savedLog.getDetails());
        assertEquals("test_user", savedLog.getPerformedBy());
    }
}
