package com.medtrack.repository;

import com.medtrack.model.NotificationPreference;
import com.medtrack.model.OperationsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Repository for per-user notification category mute preferences.
 */
@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {

    List<NotificationPreference> findByUserId(Long userId);

    Optional<NotificationPreference> findByUserIdAndCategory(Long userId, OperationsEvent.EventCategory category);

    List<NotificationPreference> findByUserIdAndMutedTrue(Long userId);

    default Set<OperationsEvent.EventCategory> mutedCategoriesFor(Long userId) {
        return findByUserIdAndMutedTrue(userId).stream()
                .map(NotificationPreference::getCategory)
                .collect(java.util.stream.Collectors.toSet());
    }
}
