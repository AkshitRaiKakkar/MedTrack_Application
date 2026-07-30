package com.medtrack.service;

import com.medtrack.dto.SupplierMetricsDto;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.repository.EquipmentOrderRepository;
import org.junit.jupiter.api.AfterEach;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.stream.Collectors;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.medtrack.util.SupplierInvoicePdf;
import com.medtrack.auth.service.EmailService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private EquipmentOrderRepository orderRepository;

    @Mock
    private SupplierInvoicePdf supplierInvoicePdf;

    @Mock
    private EmailService emailService;

    // OrderService resolves the caller's organisation through UserRepository. The test never declared
    // this mock, so @InjectMocks left the field null - one of the reasons the organisation-scoped
    // tests could not work even once a security context was supplied.
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    private EquipmentOrder mockOrder;

    @AfterEach
    void clearSecurityContext() {
        // The service reads SecurityContextHolder, which is thread-local and shared across tests in
        // the same thread. Leaving an authentication behind would leak into unrelated cases.
        SecurityContextHolder.clearContext();
    }

    /**
     * Populates a security context for the tests that exercise organisation-scoped reads.
     *
     * <p>{@code OrderService.getCurrentUserOrganization()} resolves the caller from
     * {@code SecurityContextHolder} and throws {@code RuntimeException("User not authenticated")}
     * when there is none. Three tests were failing on exactly that: the service moved to
     * context-based scoping and the tests never started supplying one.</p>
     */
    private void authenticateAs(String email, String organization, String... roles) {
        List<SimpleGrantedAuthority> authorities = Arrays.stream(roles)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "n/a", authorities));

        lenient().when(userRepository.findByEmail(email)).thenReturn(Optional.of(
                User.builder().id(1L).email(email).organization(organization).build()));
    }

    @BeforeEach
    void setUp() {
        mockOrder = EquipmentOrder.builder()
                .id(1L)
                .orderCode("ORD-1111")
                .equipmentId("EQ-100")
                .equipmentName("Ventilator Alpha")
                .quantity(3)
                .unitCost(BigDecimal.valueOf(2000.00))
                .status("PENDING")
                .shippingStatus("Processing")
                .hospital("City Hospital")
                .createdBy("admin@cityhospital.com")
                .orderDate(LocalDateTime.now().minusDays(10))
                .build();
    }

    @Test
    void updateOrderStatus_Shipped_SetsDispatchedAtAndTracking() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));
        when(orderRepository.save(any(EquipmentOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        EquipmentOrder updated = orderService.updateOrderStatus(1L, "Shipped", "Dispatched to delivery terminal");

        assertNotNull(updated);
        assertEquals("Shipped", updated.getStatus());
        assertEquals("Shipped", updated.getShippingStatus());
        assertNotNull(updated.getDispatchedAt());
        assertNotNull(updated.getTrackingNo());
        assertEquals("MedExpress Logistics", updated.getCarrier());
        verify(orderRepository).save(mockOrder);
    }

    @Test
    void updateOrderStatus_Delivered_SetsDeliveredAt() {
        mockOrder.setShippingStatus("Shipped");
        mockOrder.setStatus("Shipped");
        mockOrder.setDispatchedAt(LocalDateTime.now().minusDays(3));

        when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));
        when(orderRepository.save(any(EquipmentOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        EquipmentOrder updated = orderService.updateOrderStatus(1L, "Delivered", "Handed over to facilities desk");

        assertNotNull(updated);
        assertEquals("Delivered", updated.getStatus());
        assertEquals("Delivered", updated.getShippingStatus());
        assertNotNull(updated.getDeliveredAt());
        verify(orderRepository).save(mockOrder);
    }

    @Test
    void getSupplierMetrics_CalculatesCorrectKPIs() {
        // Authenticated as a supplier on purpose: getSupplierMetrics goes through getAllOrders,
        // which returns findAll() for ROLE_SUPPLIER and an organisation-scoped query for everyone
        // else. The fixture stubs findAll(), so a hospital caller would correctly see zero orders
        // and the KPI assertions would all read 0.
        authenticateAs("supplier@medtrack.com", "Global Suppliers Ltd", "ROLE_SUPPLIER");
        // Order 1: Delivered in 5 days (On-Time)
        EquipmentOrder order1 = EquipmentOrder.builder()
                .id(10L)
                .status("Delivered")
                .shippingStatus("Delivered")
                .orderDate(LocalDateTime.now().minusDays(10))
                .deliveredAt(LocalDateTime.now().minusDays(5))
                .build();

        // Order 2: Delivered in 10 days (Late, SLA is 7 days)
        EquipmentOrder order2 = EquipmentOrder.builder()
                .id(20L)
                .status("Delivered")
                .shippingStatus("Delivered")
                .orderDate(LocalDateTime.now().minusDays(12))
                .deliveredAt(LocalDateTime.now().minusDays(2))
                .build();

        // Order 3: Shipped (Pending delivery)
        EquipmentOrder order3 = EquipmentOrder.builder()
                .id(30L)
                .status("Shipped")
                .shippingStatus("Shipped")
                .orderDate(LocalDateTime.now().minusDays(1))
                .build();

        // Order 4: Processing (Pending fulfillment)
        EquipmentOrder order4 = EquipmentOrder.builder()
                .id(40L)
                .status("PENDING")
                .shippingStatus("Processing")
                .orderDate(LocalDateTime.now())
                .build();

        when(orderRepository.findAll()).thenReturn(Arrays.asList(order1, order2, order3, order4));

        SupplierMetricsDto metrics = orderService.getSupplierMetrics();

        assertNotNull(metrics);
        assertEquals(4, metrics.getTotalOrders());
        assertEquals(2, metrics.getPendingOrders()); // order 4 (processing) & order 3 (shipped is active or PENDING in status logic) -> Wait, order 3 is status Shipped but shippingStatus Shipped, our code checks shippingStatus Processing or Pending or PENDING status. Let's see: order 4 status PENDING -> pending. Order 3 status Shipped -> not pending in our filter. Wait, what about total count?
        assertEquals(1, metrics.getShippedOrders());
        assertEquals(2, metrics.getDeliveredOrders());
        
        // Avg days calculation: order 1 is 5 days, order 2 is 10 days -> (5+10)/2 = 7.5 days
        assertEquals(7.5, metrics.getAverageDeliveryDays());

        // On-time rate calculation: order 1 is on-time (5 days <= 7), order 2 is late (10 days > 7) -> 1 of 2 delivered is on-time -> 50.0%
        assertEquals(50.0, metrics.getOnTimeRate());
     }

     @Test
     void generateInvoicePdf_ReturnsPdfBytes() {
        authenticateAs("admin@cityhospital.com", "City Hospital", "ROLE_HOSPITAL");
         byte[] expectedPdfBytes = new byte[]{1, 2, 3};
         when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));
         when(supplierInvoicePdf.generate(mockOrder)).thenReturn(expectedPdfBytes);

         byte[] result = orderService.generateInvoicePdf(1L);

         assertNotNull(result);
         assertArrayEquals(expectedPdfBytes, result);
         verify(supplierInvoicePdf).generate(mockOrder);
     }

     @Test
     void emailInvoice_TriggersEmailService() {
        authenticateAs("admin@cityhospital.com", "City Hospital", "ROLE_HOSPITAL");
         byte[] expectedPdfBytes = new byte[]{1, 2, 3};
         when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));
         when(supplierInvoicePdf.generate(mockOrder)).thenReturn(expectedPdfBytes);

         orderService.emailInvoice(1L);

         verify(emailService).sendInvoiceEmail(eq("admin@cityhospital.com"), eq("ORD-1111"), eq(expectedPdfBytes));
     }
}
