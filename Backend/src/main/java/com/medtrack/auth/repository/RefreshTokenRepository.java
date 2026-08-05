package com.medtrack.auth.repository;

import com.medtrack.auth.model.RefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
     * Finds a refresh token record matching the specified token value string.
     * This query is commonly used during token refresh and single-session logout workflows to fetch the token's metadata.
     *
     * @param token the UUID string of the token to find
     * @return an {@link Optional} containing the matched {@link RefreshToken} if found, or {@link Optional#empty()} if no match exists
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Loads a refresh token while holding a database write lock until the surrounding
     * transaction completes. Rotation uses this lookup so two requests cannot both
     * observe the same token as active and issue independent replacement sessions.
     *
     * @param token the token value to lock
     * @return the locked token, when it exists
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select refreshToken from RefreshToken refreshToken where refreshToken.token = :token")
    Optional<RefreshToken> findByTokenForUpdate(@Param("token") String token);

    /**
     * Deletes all refresh tokens belonging to the specified user ID from database storage.
     * This operation is typically executed during security events (e.g. password resets or "logout everywhere" options) to force session expiration.
     *
     * @param userId the ID of the user whose tokens should be deleted
     */
    void deleteByUserId(Long userId);
}
