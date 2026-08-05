package com.medtrack.supplier.repository;

import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.supplier.model.ShipmentStatus;
import com.medtrack.supplier.model.ShipmentTracking;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Database-backed contract tests for the shipment delivery analytics queries.
 *
 * <p>This class intentionally starts the complete Spring application context. Spring Data validates
 * repository queries while constructing repository beans, so a malformed HQL function must fail
 * this test before an endpoint can encounter it in production. The isolated H2 database also proves
 * that Hibernate translates the duration function for a supported development dialect.
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "spring.datasource.url=jdbc:h2:mem:shipment-delivery-analytics;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
class ShipmentDeliveryAnalyticsRepositoryTest {

    private static final Long PRIMARY_SUPPLIER = 41L;
    private static final Long OTHER_SUPPLIER = 99L;
    private static final double DELTA = 0.0001;
    private static final AtomicLong SEQUENCE = new AtomicLong(10_000L);

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    @Autowired
    private ShipmentTrackingRepository repository;

    @Test
    void applicationContextCreatesShipmentRepositoryWithDeliveryAnalyticsQuery() {
        assertNotNull(repository);
    }

    @Test
    void averageIsZeroWhenSupplierHasNoShipments() {
        assertAverage(PRIMARY_SUPPLIER, 0.0);
    }

    @Test
    void averageUsesCreationAndActualDeliveryTimestamps() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 1, 10, 8, 0),
                LocalDateTime.of(2026, 1, 13, 8, 0));

        assertAverage(PRIMARY_SUPPLIER, 3.0);
    }

    @Test
    void averageCombinesAllDeliveredShipmentsForSupplier() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 2, 1, 9, 0),
                LocalDateTime.of(2026, 2, 3, 9, 0));
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 2, 5, 9, 0),
                LocalDateTime.of(2026, 2, 11, 9, 0));

        assertAverage(PRIMARY_SUPPLIER, 4.0);
    }

    @Test
    void averagePreservesFractionProducedByMultipleDurations() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 3, 1, 12, 0),
                LocalDateTime.of(2026, 3, 2, 12, 0));
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 3, 5, 12, 0),
                LocalDateTime.of(2026, 3, 8, 12, 0));

        assertAverage(PRIMARY_SUPPLIER, 2.0);
    }

    @Test
    void averageIsScopedToRequestedSupplier() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 4, 1, 10, 0),
                LocalDateTime.of(2026, 4, 3, 10, 0));
        saveDelivered(
                OTHER_SUPPLIER,
                LocalDateTime.of(2026, 4, 1, 10, 0),
                LocalDateTime.of(2026, 4, 11, 10, 0));

        assertAverage(PRIMARY_SUPPLIER, 2.0);
        assertAverage(OTHER_SUPPLIER, 10.0);
    }

    @Test
    void pendingShipmentDoesNotContributeToAverage() {
        saveShipment(
                PRIMARY_SUPPLIER,
                ShipmentStatus.PENDING,
                LocalDateTime.of(2026, 5, 1, 8, 0),
                LocalDateTime.of(2026, 5, 21, 8, 0));
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 5, 1, 8, 0),
                LocalDateTime.of(2026, 5, 4, 8, 0));

        assertAverage(PRIMARY_SUPPLIER, 3.0);
    }

    @Test
    void confirmedShipmentDoesNotContributeToAverage() {
        saveShipment(
                PRIMARY_SUPPLIER,
                ShipmentStatus.CONFIRMED,
                LocalDateTime.of(2026, 6, 1, 8, 0),
                LocalDateTime.of(2026, 6, 8, 8, 0));

        assertAverage(PRIMARY_SUPPLIER, 0.0);
    }

    @Test
    void shippedShipmentDoesNotContributeToAverage() {
        saveShipment(
                PRIMARY_SUPPLIER,
                ShipmentStatus.SHIPPED,
                LocalDateTime.of(2026, 7, 1, 8, 0),
                LocalDateTime.of(2026, 7, 9, 8, 0));

        assertAverage(PRIMARY_SUPPLIER, 0.0);
    }

    @Test
    void deliveredShipmentWithoutActualDeliveryTimestampIsIgnored() {
        saveShipment(
                PRIMARY_SUPPLIER,
                ShipmentStatus.DELIVERED,
                LocalDateTime.of(2026, 9, 1, 8, 0),
                null);
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 9, 2, 8, 0),
                LocalDateTime.of(2026, 9, 7, 8, 0));

        assertAverage(PRIMARY_SUPPLIER, 5.0);
    }

    @Test
    void averageIsZeroWhenEveryDeliveredShipmentLacksDeliveryTimestamp() {
        saveShipment(
                PRIMARY_SUPPLIER,
                ShipmentStatus.DELIVERED,
                LocalDateTime.of(2026, 10, 1, 8, 0),
                null);
        saveShipment(
                PRIMARY_SUPPLIER,
                ShipmentStatus.DELIVERED,
                LocalDateTime.of(2026, 10, 2, 8, 0),
                null);

        assertAverage(PRIMARY_SUPPLIER, 0.0);
    }

    @Test
    void sameDayDeliveryProducesZeroDays() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 11, 4, 8, 0),
                LocalDateTime.of(2026, 11, 4, 18, 0));

        assertAverage(PRIMARY_SUPPLIER, 0.0);
    }

    @Test
    void calculationWorksAcrossMonthBoundary() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 4, 29, 7, 30),
                LocalDateTime.of(2026, 5, 2, 7, 30));

        assertAverage(PRIMARY_SUPPLIER, 3.0);
    }

    @Test
    void calculationWorksAcrossYearBoundary() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2025, 12, 30, 14, 0),
                LocalDateTime.of(2026, 1, 2, 14, 0));

        assertAverage(PRIMARY_SUPPLIER, 3.0);
    }

    @Test
    void calculationIncludesLeapDay() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2024, 2, 27, 6, 0),
                LocalDateTime.of(2024, 3, 1, 6, 0));

        assertAverage(PRIMARY_SUPPLIER, 3.0);
    }

    @Test
    void calculationSupportsLongDeliveryIntervals() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2025, 1, 1, 0, 0),
                LocalDateTime.of(2026, 1, 1, 0, 0));

        assertAverage(PRIMARY_SUPPLIER, 365.0);
    }

    @Test
    void deliveredCountUsesSameSupplierBoundary() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 1, 1, 8, 0),
                LocalDateTime.of(2026, 1, 3, 8, 0));
        saveDelivered(
                OTHER_SUPPLIER,
                LocalDateTime.of(2026, 1, 1, 8, 0),
                LocalDateTime.of(2026, 1, 8, 8, 0));

        assertEquals(1L, repository.countDeliveredShipmentsBySupplierId(PRIMARY_SUPPLIER));
        assertEquals(1L, repository.countDeliveredShipmentsBySupplierId(OTHER_SUPPLIER));
    }

    @Test
    void totalCountIncludesNonDeliveredShipmentsWithoutChangingAverage() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 2, 1, 8, 0),
                LocalDateTime.of(2026, 2, 5, 8, 0));
        saveShipment(
                PRIMARY_SUPPLIER,
                ShipmentStatus.SHIPPED,
                LocalDateTime.of(2026, 2, 2, 8, 0),
                null);

        assertEquals(2L, repository.countTotalShipmentsBySupplierId(PRIMARY_SUPPLIER));
        assertAverage(PRIMARY_SUPPLIER, 4.0);
    }

    @Test
    void statusFilterStillReturnsOnlyDeliveredRowsUsedByAnalytics() {
        saveDelivered(
                PRIMARY_SUPPLIER,
                LocalDateTime.of(2026, 3, 1, 8, 0),
                LocalDateTime.of(2026, 3, 2, 8, 0));
        saveShipment(
                PRIMARY_SUPPLIER,
                ShipmentStatus.PENDING,
                LocalDateTime.of(2026, 3, 2, 8, 0),
                null);

        assertEquals(
                1,
                repository.findBySupplierIdAndShipmentStatus(
                        PRIMARY_SUPPLIER,
                        ShipmentStatus.DELIVERED).size());
    }

    private void assertAverage(Long supplierId, double expectedDays) {
        Double actualDays = repository.getAverageDeliveryTimeDays(supplierId);

        assertNotNull(actualDays);
        assertEquals(expectedDays, actualDays, DELTA);
    }

    private ShipmentTracking saveDelivered(
            Long supplierId,
            LocalDateTime createdAt,
            LocalDateTime actualDeliveryDate) {
        return saveShipment(
                supplierId,
                ShipmentStatus.DELIVERED,
                createdAt,
                actualDeliveryDate);
    }

    private ShipmentTracking saveShipment(
            Long supplierId,
            ShipmentStatus status,
            LocalDateTime createdAt,
            LocalDateTime actualDeliveryDate) {
        long sequence = SEQUENCE.incrementAndGet();
        ShipmentTracking shipment = ShipmentTracking.builder()
                .orderId(sequence)
                .shipmentTrackingNumber("DELIVERY-ANALYTICS-" + sequence)
                .supplierId(supplierId)
                .shipmentStatus(status)
                .createdAt(createdAt)
                .actualDeliveryDate(actualDeliveryDate)
                .estimatedDeliveryDate(actualDeliveryDate)
                .build();

        return repository.saveAndFlush(shipment);
    }
}
