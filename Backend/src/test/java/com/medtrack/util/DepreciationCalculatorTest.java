package com.medtrack.util;

import com.medtrack.model.DepreciationMethod;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DepreciationCalculatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 8, 3);

    @Test
    void straightLine_AccumulatedDepreciation_ExactAtCleanYears() {
        // 10-year life, exactly 5 elapsed years -> half written off, no day-count noise.
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("100000"), 10, DepreciationMethod.STRAIGHT_LINE, 5.0);

        assertEquals(new BigDecimal("50000.00"), accumulated);
    }

    @Test
    void straightLine_BookValue_DepreciatesTowardsZero() {
        // 5 calendar years ago is 1826 days (leap day included): 1826/365.25 ~ 5.0 years.
        BigDecimal bookValue = DepreciationCalculator.bookValue(
                new BigDecimal("100000"),
                TODAY.minusDays(1826),
                10,
                DepreciationMethod.STRAIGHT_LINE,
                TODAY);

        assertTrue(bookValue.compareTo(BigDecimal.ZERO) > 0);
        assertTrue(bookValue.compareTo(new BigDecimal("100000.00")) < 0);
        // Roughly half the cost, within a year of rounding from the fractional-year method.
        assertTrue(bookValue.compareTo(new BigDecimal("49000.00")) > 0);
        assertTrue(bookValue.compareTo(new BigDecimal("51000.00")) < 0);
    }

    @Test
    void straightLine_NeverDropsBelowZero() {
        // 3-year-old asset of a 2-year life must floor at zero, not go negative.
        BigDecimal bookValue = DepreciationCalculator.bookValue(
                new BigDecimal("2000"),
                TODAY.minusYears(3),
                2,
                DepreciationMethod.STRAIGHT_LINE,
                TODAY);

        assertEquals(new BigDecimal("0.00"), bookValue);
    }

    @Test
    void straightLine_AccumulatedDepreciationNeverExceedsCost() {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("2000"), 2, DepreciationMethod.STRAIGHT_LINE, 10.0);

        assertEquals(new BigDecimal("2000.00"), accumulated);
    }

    @Test
    void decliningBalance_DepreciatesFasterThanStraightLine() {
        BigDecimal declining = DepreciationCalculator.bookValue(
                new BigDecimal("100000"), TODAY.minusDays(1826), 10,
                DepreciationMethod.DECLINING_BALANCE, TODAY);
        BigDecimal straightLine = DepreciationCalculator.bookValue(
                new BigDecimal("100000"), TODAY.minusDays(1826), 10,
                DepreciationMethod.STRAIGHT_LINE, TODAY);

        assertTrue(declining.compareTo(straightLine) < 0,
                "declining balance must show a lower book value than straight line");
        // Book value must be a positive, sane fraction of cost - it cannot be below zero.
        assertTrue(declining.compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void decliningBalance_AccumulatedDepreciation_ExactAtCleanYears() {
        // Double-declining over 5 years: 100000 * (1 - (1-0.2)^5) = 67232 exactly.
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("100000"), 10, DepreciationMethod.DECLINING_BALANCE, 5.0);

        assertEquals(new BigDecimal("67232.00"), accumulated);
    }

    @Test
    void decliningBalance_OneYearLife_ProrationProducesFiniteValue() {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("1000.00"), 1, DepreciationMethod.DECLINING_BALANCE, 0.5);

        assertEquals(new BigDecimal("500.00"), accumulated);
    }

    @Test
    void decliningBalance_OneYearLife_FullyDepreciatesAtOneYear() {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("1000.00"), 1, DepreciationMethod.DECLINING_BALANCE, 1.0);

        assertEquals(new BigDecimal("1000.00"), accumulated);
    }

    @Test
    void decliningBalance_OneYearLife_BookValueFallsDuringPartialYear() {
        BigDecimal bookValue = DepreciationCalculator.bookValue(
                new BigDecimal("1200.00"),
                TODAY.minusDays(183),
                1,
                DepreciationMethod.DECLINING_BALANCE,
                TODAY);

        assertTrue(bookValue.compareTo(new BigDecimal("595.00")) > 0);
        assertTrue(bookValue.compareTo(new BigDecimal("605.00")) < 0);
    }

    @Test
    void decliningBalance_TwoYearLife_ProrationUsesOpeningBookValue() {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("2000.00"), 2, DepreciationMethod.DECLINING_BALANCE, 0.25);

        assertEquals(new BigDecimal("500.00"), accumulated);
    }

    @Test
    void decliningBalance_PartialSecondYear_DepreciatesRemainingValue() {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("10000.00"), 10, DepreciationMethod.DECLINING_BALANCE, 1.5);

        // Year one removes 20%; half of year two removes 10% of the remaining 8000.
        assertEquals(new BigDecimal("2800.00"), accumulated);
    }

    @ParameterizedTest
    @CsvSource({
            "0.25, 500.00",
            "0.50, 1000.00",
            "0.75, 1500.00",
            "1.00, 2000.00",
            "1.25, 2400.00",
            "1.50, 2800.00",
            "1.75, 3200.00",
            "2.00, 3600.00",
            "3.00, 4880.00",
            "5.00, 6723.20"
    })
    void decliningBalance_ProrationIsStableAcrossWholeAndPartialYears(
            double elapsedYears,
            String expected) {

        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("10000.00"),
                10,
                DepreciationMethod.DECLINING_BALANCE,
                elapsedYears);

        assertEquals(new BigDecimal(expected), accumulated);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5, 10, 20, 50})
    void decliningBalance_AllSupportedUsefulLivesReturnBoundedValues(int usefulLifeYears) {
        BigDecimal purchaseCost = new BigDecimal("72500.50");

        for (double elapsedYears = 0.125; elapsedYears <= usefulLifeYears; elapsedYears += 0.125) {
            BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                    purchaseCost,
                    usefulLifeYears,
                    DepreciationMethod.DECLINING_BALANCE,
                    elapsedYears);

            assertTrue(accumulated.signum() >= 0);
            assertTrue(accumulated.compareTo(purchaseCost) <= 0);
        }
    }

    @ParameterizedTest
    @ValueSource(doubles = {0.01, 0.1, 0.49, 0.5, 0.99})
    void decliningBalance_OneYearLifeRemainsFiniteForFractionalElapsedYears(double elapsedYears) {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("1000.00"),
                1,
                DepreciationMethod.DECLINING_BALANCE,
                elapsedYears);

        assertTrue(accumulated.signum() > 0);
        assertTrue(accumulated.compareTo(new BigDecimal("1000.00")) < 0);
    }

    @Test
    void decliningBalance_ElapsedLifeIsCappedAtUsefulLife() {
        BigDecimal atEndOfLife = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("5000.00"), 5, DepreciationMethod.DECLINING_BALANCE, 5.0);
        BigDecimal longAfterEndOfLife = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("5000.00"), 5, DepreciationMethod.DECLINING_BALANCE, 500.0);

        assertEquals(atEndOfLife, longAfterEndOfLife);
    }

    @Test
    void straightLine_ElapsedLifeIsCappedAtUsefulLife() {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("5000.00"), 5, DepreciationMethod.STRAIGHT_LINE, 500.0);

        assertEquals(new BigDecimal("5000.00"), accumulated);
    }

    @ParameterizedTest
    @ValueSource(doubles = {Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY})
    void nonFiniteElapsedYears_DoNotEscapeIntoMonetaryValues(double elapsedYears) {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("5000.00"),
                5,
                DepreciationMethod.DECLINING_BALANCE,
                elapsedYears);

        assertEquals(BigDecimal.ZERO, accumulated);
    }

    @Test
    void zeroPurchaseCost_HasNoAccumulatedDepreciation() {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                BigDecimal.ZERO, 5, DepreciationMethod.DECLINING_BALANCE, 2.0);

        assertEquals(BigDecimal.ZERO, accumulated);
    }

    @Test
    void negativeLegacyPurchaseCost_HasNoAccumulatedDepreciation() {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("-100.00"), 5, DepreciationMethod.DECLINING_BALANCE, 2.0);

        assertEquals(BigDecimal.ZERO, accumulated);
    }

    @ParameterizedTest
    @ValueSource(ints = {-10, -1, 0})
    void invalidUsefulLife_HasNoAccumulatedDepreciation(int usefulLifeYears) {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("1000.00"),
                usefulLifeYears,
                DepreciationMethod.DECLINING_BALANCE,
                0.5);

        assertEquals(BigDecimal.ZERO, accumulated);
    }

    @ParameterizedTest
    @ValueSource(doubles = {-100.0, -0.01, 0.0})
    void nonPositiveElapsedLife_HasNoAccumulatedDepreciation(double elapsedYears) {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("1000.00"),
                1,
                DepreciationMethod.DECLINING_BALANCE,
                elapsedYears);

        assertEquals(BigDecimal.ZERO, accumulated);
    }

    @Test
    void fractionalCentCost_IsRoundedOnlyAtTheOutputBoundary() {
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                new BigDecimal("1000.01"), 10, DepreciationMethod.DECLINING_BALANCE, 0.5);

        assertEquals(new BigDecimal("100.00"), accumulated);
    }

    @Test
    void bookValueAndAccumulatedDepreciationReconcileToPurchaseCost() {
        BigDecimal cost = new BigDecimal("123456.78");
        LocalDate purchaseDate = TODAY.minusDays(731);
        double elapsedYears = 731.0 / 365.25;

        BigDecimal bookValue = DepreciationCalculator.bookValue(
                cost, purchaseDate, 7, DepreciationMethod.DECLINING_BALANCE, TODAY);
        BigDecimal accumulated = DepreciationCalculator.accumulatedDepreciation(
                cost, 7, DepreciationMethod.DECLINING_BALANCE, elapsedYears);

        assertEquals(cost, bookValue.add(accumulated));
    }

    @Test
    void nullMethod_FallsBackToStraightLine() {
        BigDecimal withMethod = DepreciationCalculator.bookValue(
                new BigDecimal("100000"), TODAY.minusDays(1826), 10,
                DepreciationMethod.STRAIGHT_LINE, TODAY);
        BigDecimal withoutMethod = DepreciationCalculator.bookValue(
                new BigDecimal("100000"), TODAY.minusDays(1826), 10, null, TODAY);

        assertEquals(withMethod, withoutMethod);
    }

    @Test
    void nullPurchaseDate_NoDepreciationAccrues() {
        BigDecimal bookValue = DepreciationCalculator.bookValue(
                new BigDecimal("100000"), null, 10, DepreciationMethod.STRAIGHT_LINE, TODAY);

        assertEquals(new BigDecimal("100000.00"), bookValue);
    }

    @Test
    void nullUsefulLife_NoDepreciationAccrues() {
        BigDecimal bookValue = DepreciationCalculator.bookValue(
                new BigDecimal("100000"), TODAY.minusYears(5), null,
                DepreciationMethod.STRAIGHT_LINE, TODAY);

        assertEquals(new BigDecimal("100000.00"), bookValue);
    }

    @Test
    void nullCost_ReturnsNull() {
        assertNull(DepreciationCalculator.bookValue(
                null, TODAY.minusYears(5), 10, DepreciationMethod.STRAIGHT_LINE, TODAY));
    }

    @Test
    void futurePurchaseDate_NoDepreciationAccrues() {
        BigDecimal bookValue = DepreciationCalculator.bookValue(
                new BigDecimal("100000"), TODAY.plusYears(1), 10,
                DepreciationMethod.STRAIGHT_LINE, TODAY);

        assertEquals(new BigDecimal("100000.00"), bookValue);
    }

    @Test
    void replacementCost_CompoundsPurchasePrice() {
        // 5 years at 3% inflation sits between 1.03^4 and 1.03^6 - assert the band, not the
        // exact day-fractional figure.
        BigDecimal replacement = DepreciationCalculator.projectedReplacementCost(
                new BigDecimal("100000"), TODAY.minusDays(1826), TODAY);

        assertTrue(replacement.compareTo(new BigDecimal("112550.88")) > 0); // 1.03^4
        assertTrue(replacement.compareTo(new BigDecimal("119405.23")) < 0); // 1.03^6
    }

    @Test
    void replacementCost_NoPurchaseDate_EqualsPurchasePrice() {
        BigDecimal replacement = DepreciationCalculator.projectedReplacementCost(
                new BigDecimal("50000"), null, TODAY);

        assertEquals(new BigDecimal("50000.00"), replacement);
    }
}
