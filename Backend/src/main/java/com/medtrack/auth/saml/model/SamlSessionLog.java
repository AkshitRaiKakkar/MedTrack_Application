package com.medtrack.auth.saml.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking validated SAML 2.0 SSO assertion sessions.
 */
@Entity
@Table(name = "saml_session_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SamlSessionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String assertionId; // e.g., SAML-90102

    @Column(nullable = false)
    private String nameId; // user email or subject ID

    @Column(nullable = false)
    private String idpEntityId;

    @Column(nullable = false)
    private String authContextClass; // PASSWORD_PROTECTED_TRANSPORT, MFA_REQUIRED

    @Column(nullable = false)
    private String assertionStatus; // VALIDATED, EXPIRED, INVALID_SIGNATURE

    @Column(nullable = false)
    private LocalDateTime authenticatedAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;
}
