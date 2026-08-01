package com.medtrack.auth.soar;

import com.medtrack.auth.soar.dto.*;
import com.medtrack.auth.soar.model.*;
import com.medtrack.auth.soar.repository.*;
import com.medtrack.auth.soar.service.SoarService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SoarService}.
 */
@ExtendWith(MockitoExtension.class)
public class SoarServiceTest {

    @Mock
    private SoarPlaybookConfigRepository playbookRepository;

    @Mock
    private SoarExecutionLogRepository executionLogRepository;

    private SoarService soarService;

    @BeforeEach
    void setUp() {
        soarService = new SoarService(playbookRepository, executionLogRepository);
    }

    @Test
    void createPlaybook_Success() {
        when(playbookRepository.save(any())).thenAnswer(i -> {
            SoarPlaybookConfig p = i.getArgument(0);
            p.setId(1L);
            return p;
        });

        CreateSoarPlaybookRequest request = CreateSoarPlaybookRequest.builder()
                .playbookName("Auto-Isolate-Endpoint")
                .triggerEvent("HIGH_SEVERITY_ALERT")
                .targetAction("ISOLATE_HOST")
                .autoExecutionEnabled(true)
                .build();

        SoarPlaybookConfigResponse response = soarService.createPlaybook(request);

        assertNotNull(response);
        assertEquals("Auto-Isolate-Endpoint", response.getPlaybookName());
        assertEquals("ACTIVE", response.getStatus());
        assertNotNull(response.getPlaybookId());
    }

    @Test
    void triggerPlaybook_Success() {
        SoarPlaybookConfig playbook = SoarPlaybookConfig.builder()
                .id(1L)
                .playbookId("SOAR-PLAY-101")
                .playbookName("Auto-Isolate-Endpoint")
                .targetAction("ISOLATE_HOST")
                .status("ACTIVE")
                .build();

        when(playbookRepository.findByPlaybookId("SOAR-PLAY-101")).thenReturn(Optional.of(playbook));
        when(executionLogRepository.save(any())).thenAnswer(i -> {
            SoarExecutionLog l = i.getArgument(0);
            l.setId(1L);
            return l;
        });

        TriggerPlaybookExecutionRequest request = TriggerPlaybookExecutionRequest.builder()
                .playbookId("SOAR-PLAY-101")
                .triggerSource("SIEM_ALERT")
                .affectedResource("192.168.1.100")
                .build();

        SoarExecutionLogResponse response = soarService.triggerPlaybook(request);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals("192.168.1.100", response.getAffectedResource());
        assertNotNull(response.getExecutionId());
    }
}
