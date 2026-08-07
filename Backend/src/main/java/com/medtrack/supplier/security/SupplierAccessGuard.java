package com.medtrack.supplier.security;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Shared authorization guard for supplier-facing order and shipment endpoints that accept
 * a {@code supplierId}, or that resolve the caller's own supplier identity implicitly.
 *
 * These endpoints let a caller act on any supplier's orders and shipments, so every method
 * must confirm the caller is either acting on their own supplier account or holds the
 * HOSPITAL (administrator) role before the request reaches the underlying service.
 */
@Component
@RequiredArgsConstructor
public class SupplierAccessGuard {

    private static final Logger log = LoggerFactory.getLogger(SupplierAccessGuard.class);
    private final UserRepository userRepository;

    /**
     * Resolves the authenticated caller's own user/supplier ID.
     *
     * <p>Spring Security's principal name (from {@link Authentication#getName()}) is the
     * user's email, per {@code SecurityConfig}'s {@code UserDetailsService}, so the lookup
     * must go through {@link UserRepository#findByEmail}.
     *
     * @throws AccessDeniedException if the authenticated user cannot be resolved
     */
    public Long resolveCallerId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            log.warn("Attempted caller resolution with unauthenticated or null security context");
            throw new AccessDeniedException("Authenticated user could not be resolved");
        }
        User caller = userRepository.findByEmail(authentication.getName().trim().toLowerCase())
                .orElseThrow(() -> {
                    log.warn("Failed to resolve user account for email principal: {}", authentication.getName());
                    return new AccessDeniedException("Authenticated user could not be resolved");
                });
        return caller.getId();
    }

    /**
     * Confirms the authenticated caller may act on the given target supplier's data.
     * Hospital administrators may act on any supplier; all other callers may only act on
     * their own supplier account.
     *
     * @throws AccessDeniedException if the caller is neither the target supplier nor a HOSPITAL admin
     */
    public void assertSelfOrHospitalAdmin(Authentication authentication, Long targetSupplierId) {
        if (isHospitalAdmin(authentication)) {
            return;
        }
        Long callerId = resolveCallerId(authentication);
        if (!Objects.equals(callerId, targetSupplierId)) {
            log.warn("Access denied for caller {} attempting to access target supplier ID {}", callerId, targetSupplierId);
            throw new AccessDeniedException("You are not authorized to access this supplier's data");
        }
    }

    /**
     * Confirms the given supplier ID (e.g. the supplier already assigned to an order or
     * shipment) matches the authenticated caller, unless the caller is a HOSPITAL admin.
     */
    public void assertSelfOrHospitalAdmin(Authentication authentication, Long callerId, Long assignedSupplierId) {
        if (isHospitalAdmin(authentication) || assignedSupplierId == null) {
            return;
        }
        if (!Objects.equals(assignedSupplierId, callerId)) {
            log.warn("Access denied for caller ID {} matching assigned supplier ID {}", callerId, assignedSupplierId);
            throw new AccessDeniedException("You are not authorized to access this supplier's data");
        }
    }

    /**
     * Confirms the caller holds HOSPITAL administrator privileges.
     *
     * @param authentication active security context
     * @return true if caller has ROLE_HOSPITAL
     */
    public boolean isHospitalAdmin(Authentication authentication) {
        return hasRole(authentication, "HOSPITAL");
    }

    /**
     * Confirms the caller holds SUPPLIER privileges.
     *
     * @param authentication active security context
     * @return true if caller has ROLE_SUPPLIER
     */
    public boolean isSupplier(Authentication authentication) {
        return hasRole(authentication, "SUPPLIER");
    }

    /**
     * Internal helper to verify if the authentication authorities contain the specified role.
     */
    private boolean hasRole(Authentication authentication, String role) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        String expected = "ROLE_" + role.toUpperCase();
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equalsIgnoreCase(expected));
    }
}
