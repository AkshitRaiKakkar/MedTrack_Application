package com.medtrack.supplier.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkStatusUpdateRequest {

    @NotEmpty(message = "Order IDs list cannot be empty")
    private List<Long> orderIds;

    @NotNull(message = "Status cannot be null")
    private String status;
}
