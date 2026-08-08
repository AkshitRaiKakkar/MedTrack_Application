package com.medtrack.supplier.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkDeliveryConfirmationRequest {

    @NotEmpty(message = "Shipment IDs list cannot be empty")
    private List<Long> shipmentIds;
}
