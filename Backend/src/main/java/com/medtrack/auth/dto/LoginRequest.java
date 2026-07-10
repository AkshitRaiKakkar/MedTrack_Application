package com.medtrack.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LoginRequest is a Data Transfer Object (DTO) that encapsulates user login credentials
 * submitted via HTTP POST request to the authentication endpoint.
 *
 * <p>This object enforces validation rules to verify that required fields are present and
 * correctly formatted prior to executing authenticating logic.</p>
 *
 * <p>Annotations used:
 * <ul>
 *   <li>{@code @Data}: Lombok annotation that generates getter, setter, {@code toString()}, {@code equals()}, and {@code hashCode()} methods.</li>
 *   <li>{@code @NoArgsConstructor}: Lombok annotation generating a no-argument constructor, essential for JSON parsing frameworks.</li>
 *   <li>{@code @AllArgsConstructor}: Lombok annotation generating a constructor with all arguments.</li>
 * </ul>
 * </p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    /**
     * User's registered email address used as the unique login identifier.
     * Constraints:
     * <ul>
     *   <li>{@code @NotBlank}: Email cannot be null, empty, or whitespace.</li>
     *   <li>{@code @Email}: Must be a syntactically valid email address.</li>
     * </ul>
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    /**
     * Raw plain-text password supplied by the user.
     * Constraints:
     * <ul>
     *   <li>{@code @NotBlank}: Password cannot be null, empty, or whitespace.</li>
     * </ul>
     */
    @NotBlank(message = "Password is required")
    private String password;

    /**
     * The professional role being requested for login.
     * Must be one of: HOSPITAL, TECHNICIAN, SUPPLIER (case-insensitive — normalized in service layer).
     */
    @NotBlank(message = "Role is required")
    @Pattern(
        regexp = "(?i)^(HOSPITAL|TECHNICIAN|SUPPLIER)$",
        message = "Role must be one of: HOSPITAL, TECHNICIAN, SUPPLIER"
    )
    private String role;
}

