package com.medtrack.supplier.security;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SupplierAccessGuard}.
 * Verifies caller ID resolution, hospital admin authorization overrides,
 * and supplier boundary checks.
 */
@ExtendWith(MockitoExtension.class)
public class SupplierAccessGuardTest {

    @Mock
    private UserRepository userRepository;

    private SupplierAccessGuard accessGuard;

    @BeforeEach
    void setUp() {
        accessGuard = new SupplierAccessGuard(userRepository);
    }

    @Test
    @DisplayName("resolveCallerId successfully resolves database user ID for valid principal")
    void resolveCallerId_ValidEmail_ReturnsUserId() {
        User mockUser = User.builder().id(10L).email("supplier@medtrack.com").build();
        when(userRepository.findByEmail("supplier@medtrack.com")).thenReturn(Optional.of(mockUser));

        Authentication auth = new UsernamePasswordAuthenticationToken(
                "supplier@medtrack.com", null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        Long callerId = accessGuard.resolveCallerId(auth);
        assertEquals(10L, callerId);
    }

    @Test
    @DisplayName("resolveCallerId throws AccessDeniedException when authentication is null")
    void resolveCallerId_NullAuth_ThrowsAccessDenied() {
        assertThrows(AccessDeniedException.class, () -> accessGuard.resolveCallerId(null));
    }

    @Test
    @DisplayName("assertSelfOrHospitalAdmin allows hospital admin for any target supplier")
    void assertSelfOrHospitalAdmin_HospitalAdmin_Success() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "admin@medtrack.com", null, List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")));

        assertDoesNotThrow(() -> accessGuard.assertSelfOrHospitalAdmin(auth, 999L));
    }

    @Test
    @DisplayName("assertSelfOrHospitalAdmin throws AccessDeniedException for mismatched supplier ID")
    void assertSelfOrHospitalAdmin_MismatchedSupplierId_ThrowsAccessDenied() {
        User mockUser = User.builder().id(10L).email("supplier@medtrack.com").build();
        when(userRepository.findByEmail("supplier@medtrack.com")).thenReturn(Optional.of(mockUser));

        Authentication auth = new UsernamePasswordAuthenticationToken(
                "supplier@medtrack.com", null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        assertThrows(AccessDeniedException.class, () -> accessGuard.assertSelfOrHospitalAdmin(auth, 20L));
    }

    @Test
    @DisplayName("isSupplier returns true for authentication containing ROLE_SUPPLIER authority")
    void isSupplier_SupplierRole_ReturnsTrue() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "supplier@medtrack.com", null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        assertTrue(accessGuard.isSupplier(auth));
        assertFalse(accessGuard.isHospitalAdmin(auth));
    }

    @Test
    @DisplayName("assertSelfOrHospitalAdmin with caller and assigned supplier IDs matches valid supplier")
    void assertSelfOrHospitalAdmin_CallerAndAssignedSupplierId_MatchesSuccessfully() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "supplier@medtrack.com", null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        assertDoesNotThrow(() -> accessGuard.assertSelfOrHospitalAdmin(auth, 10L, 10L));
        assertThrows(AccessDeniedException.class, () -> accessGuard.assertSelfOrHospitalAdmin(auth, 10L, 20L));
    }
}
