package com.medtrack.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for marking events as read.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventReadRequest {

    @NotNull
    @NotEmpty
    private List<Long> eventIds;
}