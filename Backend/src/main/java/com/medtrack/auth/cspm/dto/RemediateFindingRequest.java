package com.medtrack.auth.cspm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RemediateFindingRequest {

    @NotBlank(message = "Finding ID is required")
    private String findingId;

    private String notes;
}
