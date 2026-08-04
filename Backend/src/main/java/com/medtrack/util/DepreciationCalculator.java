package com.medtrack.util;

import com.medtrack.model.DepreciationMethod;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Depreciation and replacement-value maths for the equipment fleet.
 *
 * <p>Book value is always floored at zero - an asset never shows a negative value on the books -
 * and an asset without a purchase cost has no depreciation: its book value equals its cost (null
 * or zero), exactly as if the finance fields were never filled in.</p>
 *
 * <p>Elapsed time is measured in fractional years ({@code days / 365.25}) so book value changes
 * smoothly day to day instead of jumping once a year.</p>
 */
public final class DepreciationCalculator {

    /** Annual medical-equipment price inflation used for the replacement-cost projection. */
    public static final double REPLACEMENT_INFLATION_RATE = 0.03;

    private static final MathContext MC = MathContext.DECIMAL64;

    private DepreciationCalculator() {
        // Static utility holder.
    }

    /**
     * Current book value of an asset: purchase cost minus accumulated depreciation, floored at 0.
     *
     * @param purchaseCost       purchase price; {@code null} means "no cost tracked"
     * @param purchaseDate       date acquired; {@code null} means depreciation never starts
     * @param usefulLifeYears    depreciable life in years; {@code null} or &le; 0 means no depreciation
     * @param method             depreciation method; {@code null} falls back to straight line
     * @param asOf               valuation date (typically today)
     * @return book value, or {@code null} if the asset has no purchase cost
     */
    public static BigDecimal bookValue(
            BigDecimal purchaseCost,
            LocalDate purchaseDate,
            Integer usefulLifeYears,
            DepreciationMethod method,
            LocalDate asOf) {

        BigDecimal cost = purchaseCost;
        if (cost == null) {
            return null;
        }
        if (purchaseDate == null || usefulLifeYears == null || usefulLifeYears <= 0) {
            return cost.setScale(2, RoundingMode.HALF_UP);
        }

        double elapsedYears = elapsedYears(purchaseDate, asOf);
        if (elapsedYears <= 0) {
            return cost.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal accumulated = accumulatedDepreciation(cost, usefulLifeYears, method, elapsedYears);
        return cost.subtract(accumulated).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Depreciation recognised to date for an asset with the given elapsed life.
     *
     * @param purchaseCost    purchase price
     * @param usefulLifeYears depreciable life in years
     * @param method          depreciation method; {@code null} falls back to straight line
     * @param elapsedYears    years since purchase (fractional allowed)
     * @return accumulated depreciation, never more than the purchase cost
     */
    public static BigDecimal accumulatedDepreciation(
            BigDecimal purchaseCost,
            int usefulLifeYears,
            DepreciationMethod method,
            double elapsedYears) {

        if (purchaseCost == null
                || purchaseCost.signum() <= 0
                || usefulLifeYears <= 0
                || elapsedYears <= 0
                || !Double.isFinite(elapsedYears)) {
            return BigDecimal.ZERO;
        }

        double boundedElapsedYears = Math.min(elapsedYears, usefulLifeYears);
        double depreciation;
        if (method == DepreciationMethod.DECLINING_BALANCE) {
            depreciation = decliningBalanceDepreciation(
                    purchaseCost.doubleValue(), usefulLifeYears, boundedElapsedYears);
        } else {
            double annual = purchaseCost.doubleValue() / usefulLifeYears;
            depreciation = annual * boundedElapsedYears;
        }

        return BigDecimal.valueOf(depreciation)
                .min(purchaseCost)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Double-declining depreciation with partial years prorated against the opening value of the
     * current year. The annual rate is capped at 100%; without that cap a one-year useful life
     * produces a decay factor of {@code -1}, and raising it to a fractional year produces NaN.
     */
    private static double decliningBalanceDepreciation(
            double purchaseCost,
            int usefulLifeYears,
            double elapsedYears) {

        double annualRate = Math.min(2.0 / usefulLifeYears, 1.0);
        int completeYears = (int) Math.floor(elapsedYears);
        double partialYear = elapsedYears - completeYears;
        double openingFactor = Math.pow(1.0 - annualRate, completeYears);
        double closingFactor = openingFactor * (1.0 - (annualRate * partialYear));
        return purchaseCost * (1.0 - closingFactor);
    }

    /**
     * Projected cost of replacing the asset today, compounding the purchase price at the medical
     * equipment inflation rate since acquisition. No purchase date means the estimate equals the
     * purchase price; no cost at all means no estimate.
     */
    public static BigDecimal projectedReplacementCost(
            BigDecimal purchaseCost,
            LocalDate purchaseDate,
            LocalDate asOf) {

        if (purchaseCost == null) {
            return null;
        }
        if (purchaseDate == null) {
            return purchaseCost.setScale(2, RoundingMode.HALF_UP);
        }

        double years = elapsedYears(purchaseDate, asOf);
        double growth = Math.pow(1.0 + REPLACEMENT_INFLATION_RATE, Math.max(0, years));
        return purchaseCost.multiply(BigDecimal.valueOf(growth), MC).setScale(2, RoundingMode.HALF_UP);
    }

    private static double elapsedYears(LocalDate from, LocalDate to) {
        if (from == null || to == null || !from.isBefore(to)) {
            return 0.0;
        }
        return ChronoUnit.DAYS.between(from, to) / 365.25;
    }
}
