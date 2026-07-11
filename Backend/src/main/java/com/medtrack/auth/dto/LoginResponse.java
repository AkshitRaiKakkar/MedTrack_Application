package com.medtrack.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LoginResponse is the exact JSON payload returned by POST /api/auth/login.
 *
 * <p>Shape:
 * <pre>
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "user": { "id", "name", "email", "phone", "organization", "role" },
 *   "token": "jwt_token_here"
 * }
 * </pre>
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    /** Always {@code true} on a 200 response. */
    private boolean success;

    /** Human-readable status message. */
    private String message;

    /** Nested user profile object. */
    private UserPayload user;

    /** Signed JWT access token. */
    private String token;

    /**
     * Nested user profile embedded inside the login response.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserPayload {

        /** Database primary key of the user. */
        private Long id;

        /** Full display name. */
        private String name;

        /** Login email address. */
        private String email;

        /** Optional phone number. */
        private String phone;

        /** Optional organisation / clinic name. */
        private String organization;

        /** Uppercase role string: HOSPITAL | TECHNICIAN | SUPPLIER. */
        private String role;
    }
}
