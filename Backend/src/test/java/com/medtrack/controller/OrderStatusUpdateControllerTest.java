package com.medtrack.controller;

import com.medtrack.exception.GlobalExceptionHandler;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that PUT /api/orders/{id}/status - the legacy status-update endpoint still
 * used by the supplier frontend - now enforces the same ownership guard as the newer
 * supplier-order-update path, instead of letting any supplier touch any order.
 */
@ExtendWith(MockitoExtension.class)
class OrderStatusUpdateControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private final Authentication supplierAuth = new UsernamePasswordAuthenticationToken(
            "other-supplier@medsupply.com", null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void updateStatus_SupplierNotAssignedToOrder_ReturnsForbidden() throws Exception {
        when(orderService.updateOrderStatus(eq(1L), any(), any(), any(Authentication.class)))
                .thenThrow(new AccessDeniedException("You are not authorized to access this supplier's data"));

        mockMvc.perform(put("/api/orders/1/status")
                        .principal(supplierAuth)
                        .param("status", "Shipped")
                        .param("notes", "trying to hijack this order"))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateStatus_AssignedSupplier_ReturnsOk() throws Exception {
        EquipmentOrder updated = EquipmentOrder.builder()
                .id(1L)
                .status("Shipped")
                .shippingStatus("Shipped")
                .build();

        when(orderService.updateOrderStatus(eq(1L), eq("Shipped"), any(), any(Authentication.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/orders/1/status")
                        .principal(supplierAuth)
                        .param("status", "Shipped")
                        .param("notes", "on the way"))
                .andExpect(status().isOk());
    }
}
