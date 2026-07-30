package com.medtrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtrack.dto.PlaceOrderRequest;
import com.medtrack.exception.GlobalExceptionHandler;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that {@code POST /api/orders} never lets the client control
 * server-owned fields (hospital, createdBy, workflow status) even when
 * they're present in the raw request body.
 */
@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private final Authentication hospitalUser = new UsernamePasswordAuthenticationToken(
            "admin@cityhospital.com", null, List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")));

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void placeOrder_IgnoresClientSuppliedIdentityAndWorkflowFields() throws Exception {
        EquipmentOrder saved = EquipmentOrder.builder()
                .id(1L)
                .orderCode("ORD-abc")
                .equipmentId("EQ-100")
                .equipmentName("Ventilator Alpha")
                .quantity(2)
                .hospital("City Hospital")
                .createdBy("City Hospital Admin")
                .status("PENDING")
                .shippingStatus("Processing")
                .approvalStatus(EquipmentOrder.APPROVAL_PENDING)
                .build();

        ArgumentCaptor<PlaceOrderRequest> captor = ArgumentCaptor.forClass(PlaceOrderRequest.class);
        when(orderService.placeOrder(captor.capture(), any(Authentication.class))).thenReturn(saved);

        // Raw JSON deliberately includes fields a client should never control.
        String maliciousPayload = "{"
                + "\"equipmentId\":\"EQ-100\","
                + "\"quantity\":2,"
                + "\"hospital\":\"Attacker Hospital\","
                + "\"createdBy\":\"attacker@evil.com\","
                + "\"approvalStatus\":\"APPROVED\","
                + "\"status\":\"DELIVERED\","
                + "\"shippingStatus\":\"Delivered\""
                + "}";

        mockMvc.perform(post("/api/orders")
                        .principal(hospitalUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(maliciousPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hospital").value("City Hospital"))
                .andExpect(jsonPath("$.approvalStatus").value(EquipmentOrder.APPROVAL_PENDING));

        // The DTO handed to the service must not have absorbed the spoofed fields at all.
        PlaceOrderRequest forwarded = captor.getValue();
        assertEquals("EQ-100", forwarded.getEquipmentId());
        assertEquals(2, forwarded.getQuantity());
    }

    @Test
    void placeOrder_MissingQuantity_ReturnsBadRequest() throws Exception {
        String payload = "{\"equipmentId\":\"EQ-100\"}";

        mockMvc.perform(post("/api/orders")
                        .principal(hospitalUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());

        verify(orderService, org.mockito.Mockito.never()).placeOrder(any(), any());
    }

    @Test
    void placeOrder_BlankEquipmentId_ReturnsBadRequest() throws Exception {
        PlaceOrderRequest request = PlaceOrderRequest.builder()
                .equipmentId("  ")
                .quantity(1)
                .build();

        mockMvc.perform(post("/api/orders")
                        .principal(hospitalUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void placeOrder_UnknownEquipmentCode_ReturnsNotFound() throws Exception {
        when(orderService.placeOrder(any(), any()))
                .thenThrow(new ResourceNotFoundException("Equipment not found with code: EQ-GHOST"));

        PlaceOrderRequest request = PlaceOrderRequest.builder()
                .equipmentId("EQ-GHOST")
                .quantity(1)
                .build();

        mockMvc.perform(post("/api/orders")
                        .principal(hospitalUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }
}
