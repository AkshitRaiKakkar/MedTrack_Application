package com.medtrack.auth.microsegmentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstablishSdpTunnelRequest {

    @NotBlank(message = "User email is required")
    private String userEmail;

    @NotBlank(message = "Source IP address is required")
    private String sourceIp;

    @NotBlank(message = "Target network segment is required")
    private String targetSegment; // PROD_HEALTH_DB, EHR_VAULT

    @NotBlank(message = "Tunnel protocol is required")
    private String tunnelProtocol; // WIREGUARD_UDP, IPSEC_ESP
}
