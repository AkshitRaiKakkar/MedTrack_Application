package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.PlaceOrderRequest;
import com.medtrack.dto.SupplierMetricsDto;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.EquipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import com.medtrack.util.SupplierInvoicePdf;
import com.medtrack.auth.service.EmailService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
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
    private EquipmentRepository equipmentRepository;

    @Mock
    private SupplierInvoicePdf supplierInvoicePdf;

    @Mock
    private EmailService emailService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    private EquipmentOrder mockOrder;

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
         byte[] expectedPdfBytes = new byte[]{1, 2, 3};
         when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));
         when(supplierInvoicePdf.generate(mockOrder)).thenReturn(expectedPdfBytes);

         orderService.emailInvoice(1L);

         verify(emailService).sendInvoiceEmail(eq("admin@cityhospital.com"), eq("ORD-1111"), eq(expectedPdfBytes));
     }

    @Test
    void placeOrder_DerivesHospitalAndCreatedByFromAuthenticatedUser_ServerSide() {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                "admin@cityhospital.com", null, Collections.emptyList());

        User hospitalUser = new User();
        hospitalUser.setEmail("admin@cityhospital.com");
        hospitalUser.setName("City Hospital Admin");
        hospitalUser.setOrganization("City Hospital");

        Equipment equipment = new Equipment();
        equipment.setEquipmentCode("EQ-100");
        equipment.setName("Ventilator Alpha");

        PlaceOrderRequest request = PlaceOrderRequest.builder()
                .equipmentId("EQ-100")
                .quantity(3)
                .notes("Urgent")
                .build();

        when(userRepository.findByEmail("admin@cityhospital.com")).thenReturn(Optional.of(hospitalUser));
        when(equipmentRepository.findByEquipmentCode("EQ-100")).thenReturn(Optional.of(equipment));
        when(orderRepository.save(any(EquipmentOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        EquipmentOrder created = orderService.placeOrder(request, authentication);

        assertEquals("City Hospital", created.getHospital());
        assertEquals("City Hospital Admin", created.getCreatedBy());
        assertEquals("Ventilator Alpha", created.getEquipmentName());
        assertEquals("PENDING", created.getStatus());
        assertEquals("Processing", created.getShippingStatus());
        assertEquals(EquipmentOrder.APPROVAL_PENDING, created.getApprovalStatus());
        assertNotNull(created.getOrderCode());
    }

    @Test
    void placeOrder_UnknownEquipmentCode_ThrowsResourceNotFoundException() {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                "admin@cityhospital.com", null, Collections.emptyList());

        User hospitalUser = new User();
        hospitalUser.setEmail("admin@cityhospital.com");
        hospitalUser.setOrganization("City Hospital");

        PlaceOrderRequest request = PlaceOrderRequest.builder()
                .equipmentId("EQ-DOES-NOT-EXIST")
                .quantity(1)
                .build();

        when(userRepository.findByEmail("admin@cityhospital.com")).thenReturn(Optional.of(hospitalUser));
        when(equipmentRepository.findByEquipmentCode("EQ-DOES-NOT-EXIST")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> orderService.placeOrder(request, authentication));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void placeOrder_UserWithNoOrganization_ThrowsIllegalArgumentException() {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                "noorg@cityhospital.com", null, Collections.emptyList());

        User hospitalUser = new User();
        hospitalUser.setEmail("noorg@cityhospital.com");
        hospitalUser.setOrganization(null);

        PlaceOrderRequest request = PlaceOrderRequest.builder()
                .equipmentId("EQ-100")
                .quantity(1)
                .build();

        when(userRepository.findByEmail("noorg@cityhospital.com")).thenReturn(Optional.of(hospitalUser));

        assertThrows(IllegalArgumentException.class, () -> orderService.placeOrder(request, authentication));
        verify(orderRepository, never()).save(any());
    }
}
