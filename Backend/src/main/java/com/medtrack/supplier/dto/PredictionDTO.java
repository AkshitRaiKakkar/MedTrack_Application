package com.medtrack.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionDTO {
    private String category; // e.g., "DAILY_FORECAST", "WEEKLY_FORECAST", "DELAY_PROBABILITY"
    private LocalDate predictionDate;
    private Double value; // e.g., expected number of shipments, probability %
    private String description;
}
