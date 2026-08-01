package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.SupplierMetricsDto;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import com.medtrack.supplier.security.SupplierAccessGuard;
import com.medtrack.util.SupplierInvoicePdf;
import com.medtrack.auth.service.EmailService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers order listing and the supplier scorecard.
 *
 * <p>The pagination refactor rewrote {@code getAllOrders()} to take a {@code Pageable} but left the
 * body referring to a variable that no longer existed, so the class did not compile at all. Two
 * behaviours are pinned here as a result:</p>
 *
 * <ul>
 *   <li>the listing is tenant-scoped - a supplier sees every order, a hospital user only their own
 *       organisation's - and that scoping survives paging;</li>
 *   <li>{@code getSupplierMetrics()} aggregates over the caller's <em>whole</em> order history. It
 *       is deliberately not routed through the paged read: computing an on-time rate from page 0
 *       gives a number that changes with the page size, which is worse than no number at all.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService listing and metrics")
class OrderListingTest {

    @Mock
    private EquipmentOrderRepository orderRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private SupplierInvoicePdf supplierInvoicePdf;

    @Mock
    private EmailService emailService;

    @Mock
    private ShipmentTrackingRepository shipmentTrackingRepository;

    @Mock
    private SupplierAccessGuard supplierAccessGuard;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String email, String organization, String role) {
        User user = new User();
        user.setEmail(email);
        user.setOrganization(organization);
        lenient().when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        email, null, List.of(new SimpleGrantedAuthority(role))));
    }

    private static EquipmentOrder deliveredOrder(long id, int orderedDaysAgo, int deliveredDaysAgo) {
        return EquipmentOrder.builder()
                .id(id)
                .orderCode("ORD-" + id)
                .status("Delivered")
                .shippingStatus("Delivered")
                .hospital("City Hospital")
                .orderDate(LocalDateTime.now().minusDays(orderedDaysAgo))
                .deliveredAt(LocalDateTime.now().minusDays(deliveredDaysAgo))
                .build();
    }

    @Nested
    @DisplayName("paged listing")
    class PagedListing {

        @Test
        @DisplayName("a supplier sees every order")
        void supplierSeesEveryOrder() {
            authenticateAs("supplier@medsupply.com", "Global Suppliers", "ROLE_SUPPLIER");
            Pageable pageable = PageRequest.of(0, 20);
            EquipmentOrder order = deliveredOrder(1L, 10, 5);
            when(orderRepository.findAll(pageable))
                    .thenReturn(new PageImpl<>(List.of(order), pageable, 1));

            Page<EquipmentOrder> page = orderService.getAllOrders(pageable);

            assertEquals(1, page.getTotalElements());
            verify(orderRepository).findAll(pageable);
            verify(orderRepository, never()).findByHospital(any(), any(Pageable.class));
        }

        @Test
        @DisplayName("a hospital user only sees their own organisation's orders")
        void hospitalUserIsScopedToTheirOrganisation() {
            authenticateAs("admin@cityhospital.com", "City Hospital", "ROLE_HOSPITAL");
            Pageable pageable = PageRequest.of(1, 10);
            when(orderRepository.findByHospital("City Hospital", pageable))
                    .thenReturn(new PageImpl<>(List.of(deliveredOrder(2L, 8, 3)), pageable, 11));

            Page<EquipmentOrder> page = orderService.getAllOrders(pageable);

            assertEquals(11, page.getTotalElements());
            assertEquals(1, page.getNumber());
            verify(orderRepository).findByHospital("City Hospital", pageable);
            verify(orderRepository, never()).findAll(any(Pageable.class));
        }

        @Test
        @DisplayName("rejects a null Pageable rather than falling back to an unbounded scan")
        void rejectsNullPageable() {
            authenticateAs("supplier@medsupply.com", "Global Suppliers", "ROLE_SUPPLIER");

            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> orderService.getAllOrders(null));

            assertEquals("Pageable is required", exception.getMessage());
            verify(orderRepository, never()).findAll(any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("supplier scorecard")
    class SupplierScorecard {

        @Test
        @DisplayName("aggregates over the full order history, not one page of it")
        void aggregatesOverFullHistory() {
            authenticateAs("supplier@medsupply.com", "Global Suppliers", "ROLE_SUPPLIER");

            // 60 orders, all delivered: 30 inside the 7-day SLA and 30 outside it. A page-shaped
            // read capped at 20 would report an on-time rate drawn from whichever 20 came first.
            List<EquipmentOrder> history = IntStream.rangeClosed(1, 60)
                    .mapToObj(index -> index <= 30
                            ? deliveredOrder(index, 10, 5)    // 5 days -> on time
                            : deliveredOrder(index, 20, 5))   // 15 days -> late
                    .toList();
            when(orderRepository.findAll()).thenReturn(history);

            SupplierMetricsDto metrics = orderService.getSupplierMetrics();

            assertEquals(60, metrics.getTotalOrders());
            assertEquals(60, metrics.getDeliveredOrders());
            assertEquals(50.0, metrics.getOnTimeRate());
            assertEquals(10.0, metrics.getAverageDeliveryDays());
            verify(orderRepository).findAll();
            verify(orderRepository, never()).findAll(any(Pageable.class));
        }

        @Test
        @DisplayName("a hospital caller's scorecard stays scoped to their organisation")
        void hospitalScorecardIsScoped() {
            authenticateAs("admin@cityhospital.com", "City Hospital", "ROLE_HOSPITAL");
            when(orderRepository.findByHospital("City Hospital"))
                    .thenReturn(List.of(deliveredOrder(1L, 10, 5), deliveredOrder(2L, 20, 5)));

            SupplierMetricsDto metrics = orderService.getSupplierMetrics();

            assertEquals(2, metrics.getTotalOrders());
            assertEquals(50.0, metrics.getOnTimeRate());
            verify(orderRepository).findByHospital("City Hospital");
            verify(orderRepository, never()).findAll();
        }

        @Test
        @DisplayName("reports 100% on time when nothing has been delivered yet")
        void emptyHistoryDefaultsToFullyOnTime() {
            authenticateAs("supplier@medsupply.com", "Global Suppliers", "ROLE_SUPPLIER");
            when(orderRepository.findAll()).thenReturn(List.of());

            SupplierMetricsDto metrics = orderService.getSupplierMetrics();

            assertEquals(0, metrics.getTotalOrders());
            assertEquals(0, metrics.getDeliveredOrders());
            assertEquals(100.0, metrics.getOnTimeRate());
            assertEquals(0.0, metrics.getAverageDeliveryDays());
        }
    }
}
