package com.medtrack.auth.cspm;

import com.medtrack.auth.cspm.dto.*;
import com.medtrack.auth.cspm.model.*;
import com.medtrack.auth.cspm.repository.*;
import com.medtrack.auth.cspm.service.CspmService;
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
 * Unit tests for {@link CspmService}.
 */
@ExtendWith(MockitoExtension.class)
public class CspmServiceTest {

    @Mock
    private CspmCloudAccountRepository accountRepository;

    @Mock
    private CspmSecurityFindingRepository findingRepository;

    private CspmService cspmService;

    @BeforeEach
    void setUp() {
        cspmService = new CspmService(accountRepository, findingRepository);
    }

    @Test
    void registerCloudAccount_Success() {
        when(accountRepository.findByAccountNumber("AWS-990182")).thenReturn(Optional.empty());
        when(accountRepository.save(any())).thenAnswer(i -> {
            CspmCloudAccount a = i.getArgument(0);
            a.setId(1L);
            return a;
        });

        RegisterCloudAccountRequest request = RegisterCloudAccountRequest.builder()
                .accountNumber("AWS-990182")
                .provider("AWS")
                .accountName("Dev-Medical-Vault")
                .region("us-east-1")
                .build();

        CspmCloudAccountResponse response = cspmService.registerCloudAccount(request);

        assertNotNull(response);
        assertEquals("AWS-990182", response.getAccountNumber());
        assertEquals("ACTIVE", response.getSyncStatus());
    }

    @Test
    void remediateFinding_Success() {
        CspmSecurityFinding finding = CspmSecurityFinding.builder()
                .id(1L)
                .findingId("CSPM-90102")
                .accountNumber("AWS-19203910")
                .status("OPEN")
                .build();

        when(findingRepository.findByFindingId("CSPM-90102")).thenReturn(Optional.of(finding));
        when(findingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        CspmSecurityFindingResponse response = cspmService.remediateFinding("CSPM-90102");

        assertNotNull(response);
        assertEquals("REMEDIATED", response.getStatus());
        assertNotNull(response.getRemediatedAt());
    }
}
