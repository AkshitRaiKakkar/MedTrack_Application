package com.medtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * An approver's decision on a single approval step: approve or reject, with an optional comment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApprovalDecisionRequest {

    @NotNull(message = "Approve flag is required")
    private Boolean approve;

    private String comment;
}
