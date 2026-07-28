package com.medtrack.auth.microsegmentation;

import com.medtrack.auth.microsegmentation.dto.*;
import com.medtrack.auth.microsegmentation.model.*;
import com.medtrack.auth.microsegmentation.repository.*;
import com.medtrack.auth.microsegmentation.service.MicrosegmentationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link MicrosegmentationService}.
 */
@ExtendWith(MockitoExtension.class)
public class MicrosegmentationServiceTest {

    @Mock
    private MicrosegmentationPolicyRepository policyRepository;

    @Mock
    private SdpTunnelSessionRepository tunnelRepository;

    private MicrosegmentationService microsegmentationService;

    @BeforeEach
    void setUp() {
        microsegmentationService = new MicrosegmentationService(policyRepository, tunnelRepository);
    }

    @Test
    void createRule_Success() {
        when(policyRepository.save(any())).thenAnswer(i -> {
            MicrosegmentationPolicy p = i.getArgument(0);
            p.setId(1L);
            return p;
        });

        CreateMicrosegmentationRuleRequest request = CreateMicrosegmentationRuleRequest.builder()
                .sourceSegment("PATIENT_PORTAL_DMZ")
                .destinationSegment("PROD_HEALTH_DB")
                .allowedProtocol("TCP")
                .portRange("5432")
                .postureRequirement("ENCRYPTED_MTLS_ONLY")
                .action("STRICT_ALLOW")
                .build();

        MicrosegmentationPolicyResponse response = microsegmentationService.createRule(request);

        assertNotNull(response);
        assertEquals("PATIENT_PORTAL_DMZ", response.getSourceSegment());
        assertEquals("ACTIVE", response.getStatus());
        assertNotNull(response.getRuleId());
    }

    @Test
    void establishTunnel_Success() {
        when(tunnelRepository.save(any())).thenAnswer(i -> {
            SdpTunnelSession t = i.getArgument(0);
            t.setId(1L);
            return t;
        });

        EstablishSdpTunnelRequest request = EstablishSdpTunnelRequest.builder()
                .userEmail("operator@medtrack-health.org")
                .sourceIp("10.200.4.12")
                .targetSegment("PROD_HEALTH_DB")
                .tunnelProtocol("WIREGUARD_UDP")
                .build();

        SdpTunnelSessionResponse response = microsegmentationService.establishTunnel(request);

        assertNotNull(response);
        assertEquals("operator@medtrack-health.org", response.getUserEmail());
        assertEquals("ESTABLISHED", response.getStatus());
        assertNotNull(response.getSessionId());
    }
}
