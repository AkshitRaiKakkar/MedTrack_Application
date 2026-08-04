package com.medtrack.supplier.controller;

import com.medtrack.supplier.dto.DashboardResponse;
import com.medtrack.supplier.dto.DashboardSummary;
import com.medtrack.supplier.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    @Mock
    private DashboardService dashboardService;

    @Mock
    private com.medtrack.auth.repository.UserRepository userRepository;

    @InjectMocks
    private DashboardController dashboardController;

    @BeforeEach
    void setUp() {
        // We cannot easily mock SecurityContextHolder inline for resolveSupplierId
        // without
        // more complex setup due to UserRepository inside DashboardController.
        // We'll mock the service to handle the default fallback ID which is 1L.
    }

    @Test
    void testGetDashboard() {
        DashboardResponse mockResponse = DashboardResponse.builder().build();
        when(dashboardService.getDashboard(anyLong())).thenReturn(mockResponse);

        ResponseEntity<DashboardResponse> response = dashboardController.getDashboard();

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
    }

    @Test
    void testGetSummary() {
        DashboardSummary mockSummary = DashboardSummary.builder().build();
        when(dashboardService.getSummary(anyLong())).thenReturn(mockSummary);

        ResponseEntity<DashboardSummary> response = dashboardController.getSummary();

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
    }
}
