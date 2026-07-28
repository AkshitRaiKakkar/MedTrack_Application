package com.medtrack.auth.pam;

import com.medtrack.auth.pam.dto.*;
import com.medtrack.auth.pam.model.*;
import com.medtrack.auth.pam.repository.*;
import com.medtrack.auth.pam.service.PamService;
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
 * Unit tests for {@link PamService}.
 */
@ExtendWith(MockitoExtension.class)
public class PamServiceTest {

    @Mock
    private PamPolicyConfigRepository policyRepository;

    @Mock
    private PamAccessRequestRepository requestRepository;

    @Mock
    private PamSessionAuditLogRepository sessionLogRepository;

    private PamService pamService;

    @BeforeEach
    void setUp() {
        pamService = new PamService(policyRepository, requestRepository, sessionLogRepository);
    }

    @Test
    void getActivePolicy_Success() {
        PamPolicyConfig policy = PamPolicyConfig.builder()
                .id(1L)
                .policyName("MASTER_PAM_POLICY")
                .maxSessionMinutes(60)
                .autoApproveLowRisk(true)
                .requireMfaElevation(true)
                .requireTicketNumber(true)
                .updatedAt(LocalDateTime.now())
                .build();

        when(policyRepository.findByPolicyName("MASTER_PAM_POLICY")).thenReturn(Optional.of(policy));

        PamPolicyConfigResponse response = pamService.getActivePolicy();

        assertNotNull(response);
        assertEquals(60, response.getMaxSessionMinutes());
        assertTrue(response.isRequireMfaElevation());
    }

    @Test
    void createAccessRequest_Success() {
        PamPolicyConfig policy = PamPolicyConfig.builder()
                .policyName("MASTER_PAM_POLICY")
                .maxSessionMinutes(60)
                .autoApproveLowRisk(true)
                .requireTicketNumber(true)
                .build();

        when(policyRepository.findByPolicyName("MASTER_PAM_POLICY")).thenReturn(Optional.of(policy));
        when(requestRepository.save(any())).thenAnswer(i -> {
            PamAccessRequest r = i.getArgument(0);
            r.setId(1L);
            return r;
        });

        CreatePamAccessRequest request = CreatePamAccessRequest.builder()
                .requesterEmail("developer@medtrack-health.org")
                .targetResource("PROD_PATIENT_DB")
                .requestedRole("ROLE_DBA")
                .durationMinutes(20)
                .reason("Hotfix migration patch")
                .ticketNumber("SEC-9011")
                .build();

        PamAccessRequestResponse response = pamService.createAccessRequest(request);

        assertNotNull(response);
        assertEquals("developer@medtrack-health.org", response.getRequesterEmail());
        assertEquals("APPROVED", response.getStatus()); // Auto-approved due to low risk & duration <= 30
        assertNotNull(response.getRequestId());
    }
}
