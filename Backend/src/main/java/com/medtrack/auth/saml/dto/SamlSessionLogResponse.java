package com.medtrack.auth.saml.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SamlSessionLogResponse {
    private Long id;
    private String assertionId;
    private String nameId;
    private String idpEntityId;
    private String authContextClass;
    private String assertionStatus;
    private LocalDateTime authenticatedAt;
    private LocalDateTime expiresAt;
}
