git push -u origin feature/equipment-depreciation-valuationpackage com.medtrack.util;

import com.medtrack.model.DepreciationMethod;
import org.junit.jupiter.api.Test;

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
