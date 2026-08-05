package com.medtrack.controller;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EventReadRequest;
import com.medtrack.dto.OperationsEventResponse;
import com.medtrack.dto.UnreadCountResponse;
import com.medtrack.model.EventReadReceipt;
import com.medtrack.model.Hospital;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.EventReadReceiptRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.NotificationPreferenceRepository;
import com.medtrack.repository.OperationsEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OperationsEventControllerTest {

    private static final String EMAIL = "hospital@medtrack.com";

    @Mock
    private OperationsEventRepository eventRepository;

    @Mock
    private EventReadReceiptRepository readReceiptRepository;

    @Mock
    private NotificationPreferenceRepository preferenceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @InjectMocks
    private OperationsEventController controller;

    @Mock
    private Authentication authentication;

    private User user;
    private Hospital hospital;

    @BeforeEach
    void setUp() {
        user = User.builder().id(7L).email(EMAIL).build();
        hospital = Hospital.builder().id(77L).name("Test Hospital").user(user).build();

        lenient().when(authentication.getName()).thenReturn(EMAIL);
        lenient().when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        lenient().when(hospitalRepository.findByUserId(7L)).thenReturn(Optional.of(hospital));
    }

    @Test
    void getUnreadCounts_ResolvesRealHospitalAndUserInsteadOfHardcodedOne() {
        when(preferenceRepository.mutedCategoriesFor(7L)).thenReturn(Set.of());
        when(eventRepository.countUnreadForUserByCategory(eq(77L), any(), eq(7L))).thenReturn(1L);

        ResponseEntity<UnreadCountResponse> response = controller.getUnreadCounts(authentication);

        assertEquals(6L, response.getBody().getTotal());
        verify(eventRepository, never()).countUnreadForUserByCategory(eq(1L), any(), any());
    }

    @Test
    void getUnreadCounts_ZeroesMutedCategories() {
        when(preferenceRepository.mutedCategoriesFor(7L))
                .thenReturn(Set.of(OperationsEvent.EventCategory.SHIPMENT));
        when(eventRepository.countUnreadForUserByCategory(eq(77L), any(), eq(7L))).thenReturn(3L);

        ResponseEntity<UnreadCountResponse> response = controller.getUnreadCounts(authentication);

        assertEquals(0L, response.getBody().getByCategory().get(OperationsEvent.EventCategory.SHIPMENT));
        verify(eventRepository, never())
                .countUnreadForUserByCategory(eq(77L), eq(OperationsEvent.EventCategory.SHIPMENT), eq(7L));
    }

    @Test
    void getEvents_DefaultViewExcludesMutedCategoriesAtTheQueryLevel() {
        Set<OperationsEvent.EventCategory> muted = Set.of(OperationsEvent.EventCategory.PROCUREMENT);
        when(preferenceRepository.mutedCategoriesFor(7L)).thenReturn(muted);
        when(eventRepository.findByHospitalIdExcludingCategories(eq(77L), eq(muted), any()))
                .thenReturn(new PageImpl<>(List.of()));

        controller.getEvents(null, null, 0, 20, authentication);

        verify(eventRepository).findByHospitalIdExcludingCategories(eq(77L), eq(muted), any());
        verify(eventRepository, never()).findByHospitalIdOrderByCreatedAtDesc(any(), any());
    }

    @Test
    void getEvents_ExplicitCategoryFilterIgnoresMute() {
        when(eventRepository.findByHospitalIdAndCategoryOrderByCreatedAtDesc(
                eq(77L), eq(OperationsEvent.EventCategory.PROCUREMENT), any()))
                .thenReturn(new PageImpl<>(List.of()));

        controller.getEvents(OperationsEvent.EventCategory.PROCUREMENT, null, 0, 20, authentication);

        verify(preferenceRepository, never()).mutedCategoriesFor(any());
    }

    @Test
    void getEvents_ReadFlagReflectsThisUsersReceiptNotTheSharedColumn() {
        OperationsEvent readByMe = OperationsEvent.builder().id(1L).hospitalId(77L)
                .category(OperationsEvent.EventCategory.EQUIPMENT).read(false).build();
        OperationsEvent unread = OperationsEvent.builder().id(2L).hospitalId(77L)
                .category(OperationsEvent.EventCategory.EQUIPMENT).read(false).build();
        when(preferenceRepository.mutedCategoriesFor(7L)).thenReturn(Set.of());
        when(eventRepository.findByHospitalIdOrderByCreatedAtDesc(eq(77L), any()))
                .thenReturn(new PageImpl<>(List.of(readByMe, unread)));
        when(readReceiptRepository.findByUserIdAndEventIdIn(eq(7L), any()))
                .thenReturn(List.of(EventReadReceipt.builder().eventId(1L).userId(7L).build()));

        Page<OperationsEventResponse> page = controller.getEvents(null, null, 0, 20, authentication).getBody();

        assertEquals(true, page.getContent().get(0).getRead());
        assertEquals(false, page.getContent().get(1).getRead());
    }

    @Test
    void markAsRead_RejectsEventsFromAnotherHospital() {
        OperationsEvent foreignEvent = OperationsEvent.builder().id(1L).hospitalId(999L).build();
        when(eventRepository.findAllById(List.of(1L))).thenReturn(List.of(foreignEvent));

        ResponseEntity<Void> response = controller.markAsRead(
                EventReadRequest.builder().eventIds(List.of(1L)).build(), authentication);

        assertEquals(400, response.getStatusCode().value());
        verify(readReceiptRepository, never()).saveAll(any());
    }

    @Test
    void markAsRead_DoesNotDuplicateAnExistingReceipt() {
        OperationsEvent event = OperationsEvent.builder().id(1L).hospitalId(77L).build();
        when(eventRepository.findAllById(List.of(1L))).thenReturn(List.of(event));
        when(readReceiptRepository.findByUserIdAndEventIdIn(eq(7L), eq(List.of(1L))))
                .thenReturn(List.of(EventReadReceipt.builder().eventId(1L).userId(7L).build()));

        controller.markAsRead(EventReadRequest.builder().eventIds(List.of(1L)).build(), authentication);

        ArgumentCaptor<List<EventReadReceipt>> captor = ArgumentCaptor.forClass(List.class);
        verify(readReceiptRepository).saveAll(captor.capture());
        assertEquals(0, captor.getValue().size());
    }

    @Test
    void getHospitalId_RejectsCallerWithNoHospitalProfile() {
        when(hospitalRepository.findByUserId(7L)).thenReturn(Optional.empty());

        assertThrows(AccessDeniedException.class,
                () -> controller.getUnreadCounts(authentication));
    }
}
