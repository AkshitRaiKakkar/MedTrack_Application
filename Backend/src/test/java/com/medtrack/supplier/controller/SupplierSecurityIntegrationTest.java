package com.medtrack.supplier.controller;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.security.JwtUtil;
import com.medtrack.auth.service.KafkaEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security Integration Tests for Supplier Portal and Shipment Endpoints.
 *
 * <p>Validates Role-Based Access Control (RBAC) boundaries across supplier-facing APIs:
 * <ul>
 *   <li>Unauthenticated requests are rejected with HTTP 401 Unauthorized.</li>
 *   <li>Non-supplier roles (HOSPITAL, TECHNICIAN) accessing supplier portal endpoints receive HTTP 403 Forbidden.</li>
 *   <li>Suppliers accessing their own order/shipment endpoints receive HTTP 2xx Success.</li>
 *   <li>Suppliers attempting to access another supplier's data receive HTTP 403 Forbidden.</li>
 *   <li>Invalid or revoked JWT tokens are rejected with HTTP 401 Unauthorized.</li>
 * </ul>
 * </p>
 */
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

    @Autowired
    private UserRepository userRepository;

    private Long supplierUserId;
    private Long hospitalUserId;
    private Long technicianUserId;

    @BeforeEach
    void setUpUserIdentities() {
        // Resolve database primary key IDs created by DataInitializer for test tokens
        supplierUserId = userRepository.findByEmail("supplier@medtrack.com")
                .map(User::getId)
                .orElse(3L);

        hospitalUserId = userRepository.findByEmail("hospital@medtrack.com")
                .map(User::getId)
                .orElse(1L);

        technicianUserId = userRepository.findByEmail("tech@medtrack.com")
                .map(User::getId)
                .orElse(2L);
    }

    @Test
    @DisplayName("Unauthenticated requests to supplier endpoints return HTTP 401 Unauthorized")
    void unauthenticatedAccess_Returns401() throws Exception {
        mockMvc.perform(get("/api/supplier/orders"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/supplier/dashboard"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/shipments/1"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/shipments/supplier/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("HOSPITAL role accessing supplier portal endpoints returns HTTP 403 Forbidden")
    void hospitalRole_AccessesSupplierEndpoints_Returns403() throws Exception {
        String hospitalToken = jwtUtil.generateToken(hospitalUserId, "hospital@medtrack.com", "HOSPITAL");

        mockMvc.perform(get("/api/supplier/orders")
                        .header("Authorization", "Bearer " + hospitalToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/supplier/dashboard")
                        .header("Authorization", "Bearer " + hospitalToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/shipments/supplier/1")
                        .header("Authorization", "Bearer " + hospitalToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SUPPLIER role accessing supplier portal endpoints returns HTTP 2xx Successful")
    void supplierRole_AccessesSupplierEndpoints_ReturnsOkOrNoContent() throws Exception {
        String supplierToken = jwtUtil.generateToken(supplierUserId, "supplier@medtrack.com", "SUPPLIER");

        mockMvc.perform(get("/api/supplier/orders")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().is2xxSuccessful());

        mockMvc.perform(get("/api/supplier/dashboard/summary")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    @DisplayName("SUPPLIER role accessing own shipment endpoint returns HTTP 2xx Successful")
    void supplierRole_AccessesShipmentEndpoints_ReturnsOkOrNotFound() throws Exception {
        String supplierToken = jwtUtil.generateToken(supplierUserId, "supplier@medtrack.com", "SUPPLIER");

        mockMvc.perform(get("/api/shipments/supplier/" + supplierUserId)
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    @DisplayName("TECHNICIAN role accessing supplier endpoints returns HTTP 403 Forbidden")
    void technicianRole_AccessesSupplierEndpoints_Returns403() throws Exception {
        String techToken = jwtUtil.generateToken(technicianUserId, "tech@medtrack.com", "TECHNICIAN");

        mockMvc.perform(get("/api/supplier/orders")
                        .header("Authorization", "Bearer " + techToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/shipments/supplier/" + supplierUserId)
                        .header("Authorization", "Bearer " + techToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/supplier/dashboard")
                        .header("Authorization", "Bearer " + techToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SUPPLIER role attempting to access another supplier's data returns HTTP 403 Forbidden")
    void supplierRole_AccessesOtherSupplierData_Returns403() throws Exception {
        String supplierToken = jwtUtil.generateToken(supplierUserId, "supplier@medtrack.com", "SUPPLIER");
        Long forbiddenOtherSupplierId = supplierUserId + 999L;

        mockMvc.perform(get("/api/shipments/supplier/" + forbiddenOtherSupplierId)
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Stale authority version or malformed JWT token returns HTTP 401 Unauthorized")
    void invalidTokenAuthorityVersion_Returns401() throws Exception {
        String invalidToken = jwtUtil.generateToken(supplierUserId, "supplier@medtrack.com", "SUPPLIER", 99999L);

        mockMvc.perform(get("/api/supplier/orders")
                        .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/shipments/supplier/" + supplierUserId)
                        .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SUPPLIER role accessing supplier metrics performance returns HTTP 2xx Successful")
    void supplierRole_AccessesPerformanceMetrics_Returns2xx() throws Exception {
        String supplierToken = jwtUtil.generateToken(supplierUserId, "supplier@medtrack.com", "SUPPLIER");

        mockMvc.perform(get("/api/supplier/suppliers/" + supplierUserId + "/performance")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    @DisplayName("Unauthenticated mutation requests to shipments return HTTP 401 Unauthorized")
    void unauthenticatedShipmentMutation_Returns401() throws Exception {
        mockMvc.perform(post("/api/shipments"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/shipments/1/status"))
                .andExpect(status().isUnauthorized());
    }
}
