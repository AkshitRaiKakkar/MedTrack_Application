package com.medtrack.auth.saml.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessSamlAssertionRequest {

    @NotBlank(message = "Name ID / Email is required")
    private String nameId;

    @NotBlank(message = "IdP Entity ID is required")
    private String idpEntityId;

    @NotBlank(message = "SAML XML Response Payload is required")
    private String samlResponsePayloadXml;
}
