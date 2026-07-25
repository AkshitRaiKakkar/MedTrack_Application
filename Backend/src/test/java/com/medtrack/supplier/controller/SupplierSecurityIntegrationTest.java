package com.medtrack.supplier.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.medtrack.auth.security.JwtUtil;
import com.medtrack.auth.service.KafkaEventPublisher;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
                "eureka.client.enabled=false",
                "spring.cloud.discovery.enabled=false",
                "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@AutoConfigureMockMvc
public class SupplierSecurityIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private KafkaEventPublisher kafkaEventPublisher;

        @Autowired
        private JwtUtil jwtUtil;

        @Test
        void unauthenticatedAccess_Returns401() throws Exception {
                mockMvc.perform(get("/api/supplier/orders"))
                                .andExpect(status().isUnauthorized());
                mockMvc.perform(get("/api/shipments/1"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void hospitalRole_AccessesSupplierEndpoints_Returns403() throws Exception {
                String token = jwtUtil.generateToken(2L, "hospital@medtrack.com", "HOSPITAL");
                mockMvc.perform(get("/api/supplier/orders")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isForbidden());
                mockMvc.perform(get("/api/shipments/supplier/1")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isForbidden());
        }

        @Test
        void supplierRole_AccessesSupplierEndpoints_ReturnsOkOrNoContent() throws Exception {
                String token = jwtUtil.generateToken(1L, "supplier@medtrack.com", "SUPPLIER");
                mockMvc.perform(get("/api/supplier/orders")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().is2xxSuccessful());
        }

        @Test
        void supplierRole_AccessesShipmentEndpoints_ReturnsOkOrNotFound() throws Exception {
                String token = jwtUtil.generateToken(1L, "supplier@medtrack.com", "SUPPLIER");
                mockMvc.perform(get("/api/shipments/supplier/1")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().is2xxSuccessful());
        }
}
