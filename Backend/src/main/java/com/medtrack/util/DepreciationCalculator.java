package com.medtrack.util;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Utility class responsible for equipment depreciation calculations.
 */
public final class DepreciationCalculator {

    private DepreciationCalculator() {
    }

    /**
     * Calculates current asset value using Straight Line Depreciation.
     */
    public static double calculateCurrentValue(
            double purchaseCost,
            double salvageValue,
            int usefulLifeYears,
            LocalDate purchaseDate
    ) {

        if (purchaseDate == null) {
            return purchaseCost;
        }

        long age = ChronoUnit.YEARS.between(
                purchaseDate,
                LocalDate.now()
        );

        if (age >= usefulLifeYears) {
            return salvageValue;
        }

        double annualDepreciation =
                (purchaseCost - salvageValue) / usefulLifeYears;

        double currentValue =
                purchaseCost - (annualDepreciation * age);

        return Math.max(currentValue, salvageValue);
    }

    /**
     * Calculates accumulated depreciation.
     */
    public static double calculateDepreciationAmount(
            double purchaseCost,
            double currentValue
    ) {
        return purchaseCost - currentValue;
    }

    /**
     * Calculates depreciation percentage.
     */
    public static double calculateDepreciationPercentage(
            double purchaseCost,
            double currentValue
    ) {

        if (purchaseCost == 0) {
            return 0;
        }

        return ((purchaseCost - currentValue)
                / purchaseCost) * 100;
    }

    /**
     * Calculates remaining useful life.
     */
    public static int calculateRemainingUsefulLife(
            int usefulLifeYears,
            LocalDate purchaseDate
    ) {

        if (purchaseDate == null) {
            return usefulLifeYears;
        }

        long age = ChronoUnit.YEARS.between(
                purchaseDate,
                LocalDate.now()
        );

        int remaining =
                usefulLifeYears - (int) age;

        return Math.max(remaining, 0);
    }

    /**
     * Determines if replacement is recommended.
     */
    public static boolean needsReplacement(
            int remainingUsefulLife,
            double depreciationPercentage
    ) {

        return remainingUsefulLife <= 1
                || depreciationPercentage >= 80;
    }

    /**
     * Calculates annual depreciation.
     */
    public static double annualDepreciation(
            double purchaseCost,
            double salvageValue,
            int usefulLifeYears
    ) {

        return (purchaseCost - salvageValue)
                / usefulLifeYears;
    }

    /**
     * Calculates asset age.
     */
    public static int assetAge(
            LocalDate purchaseDate
    ) {

        if (purchaseDate == null) {
            return 0;
        }

        return (int) ChronoUnit.YEARS.between(
                purchaseDate,
                LocalDate.now()
        );
    }

    /**
     * Determines equipment health.
     */
    public static String equipmentHealth(
            double depreciationPercentage
    ) {

        if (depreciationPercentage < 30) {
            return "EXCELLENT";
        }

        if (depreciationPercentage < 60) {
            return "GOOD";
        }

        if (depreciationPercentage < 80) {
            return "FAIR";
        }

        return "POOR";
    }

    /**
     * Calculates replacement score.
     */
    public static int replacementScore(
            int remainingLife,
            double depreciationPercentage
    ) {

        int score = 0;

        score += (100 - (remainingLife * 10));

        score += (int) depreciationPercentage;

        return Math.min(score, 100);
    }
}