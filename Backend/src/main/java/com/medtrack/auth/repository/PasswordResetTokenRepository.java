package com.medtrack.auth.repository;

import com.medtrack.auth.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * PasswordResetTokenRepository provides data access operations for the {@link PasswordResetToken} entity.
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Finds password reset tokens by email and used status.
     *
     * @param email the email address
     * @param used the usage status
     * @return a {@link java.util.List} of matching {@link PasswordResetToken} entities
     */
    java.util.List<PasswordResetToken> findByEmailAndUsed(String email, boolean used);

    /**
     * Finds the latest password reset token for a given email address.
     *
     * @param email the email address
     * @return an {@link Optional} containing the latest {@link PasswordResetToken} if found
     */
    Optional<PasswordResetToken> findFirstByEmailOrderByCreatedAtDesc(String email);

    /**
     * Finds the latest not-yet-used password reset token for a given email address,
     * i.e. the token an OTP/reset attempt should currently be evaluated against.
     *
     * @param email the email address
     * @return an {@link Optional} containing the latest unused {@link PasswordResetToken} if found
     */
    Optional<PasswordResetToken> findFirstByEmailAndUsedFalseOrderByCreatedAtDesc(String email);
}
