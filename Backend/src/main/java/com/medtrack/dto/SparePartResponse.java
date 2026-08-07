package com.medtrack.dto;

import com.medtrack.model.SparePart;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SparePartResponse {

    private Long id;
    private Long hospitalId;
    private String partNumber;
    private String description;
    private String compatibleModels;
    private Integer stockLevel;
    private Integer reorderPoint;
    private Double unitCost;
    private LocalDateTime createdAt;

    public static SparePartResponse from(SparePart part) {
        if (part == null) return null;
        return SparePartResponse.builder()
                .id(part.getId())
                .hospitalId(part.getHospitalId())
                .partNumber(part.getPartNumber())
                .description(part.getDescription())
                .compatibleModels(part.getCompatibleModels())
                .stockLevel(part.getStockLevel())
                .reorderPoint(part.getReorderPoint())
                .unitCost(part.getUnitCost())
                .createdAt(part.getCreatedAt())
                .build();
    }
}
