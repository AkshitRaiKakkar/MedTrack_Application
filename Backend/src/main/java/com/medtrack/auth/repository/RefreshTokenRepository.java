package com.medtrack.auth.repository;

import com.medtrack.auth.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * RefreshTokenRepository provides data access operations for the {@link RefreshToken} entity.
 * It extends {@link JpaRepository} to provide standard database CRUD actions.
 *
 * <p>Annotations used:
 * <ul>
 *   <li>{@code @Repository}: Marks this interface as a Spring-managed repository component.</li>
 * </ul>
 * </p>
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Finds a refresh token record matching the specified token value.
     *
     * @param token the UUID string of the token to find
     * @return an {@link Optional} containing the matched {@link RefreshToken} if found, or {@link Optional#empty()}
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Deletes all refresh tokens belonging to the specified user.
     * This is typically used for "revoke all session" operations.
     *
     * @param userId the ID of the user whose tokens should be deleted
     */
    void deleteByUserId(Long userId);
}
