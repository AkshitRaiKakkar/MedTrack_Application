package com.medtrack.auth.microsegmentation.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SdpTunnelSessionResponse {
    private Long id;
    private String sessionId;
    private String userEmail;
    private String sourceIp;
    private String targetSegment;
    private String tunnelProtocol;
    private String status;
    private long txBytes;
    private long rxBytes;
    private LocalDateTime establishedAt;
}
