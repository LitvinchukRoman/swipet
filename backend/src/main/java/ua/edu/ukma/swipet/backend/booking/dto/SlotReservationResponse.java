package ua.edu.ukma.swipet.backend.booking.dto;

import ua.edu.ukma.swipet.backend.booking.entity.ReservationStatus;

import java.time.LocalDateTime;

/** Бронювання слоту для адміна притулку (GET /slots/{id}/reservations) — хто записався. */
public record SlotReservationResponse(
        Long id,
        Long userId,
        String userName,
        String userEmail,
        String notes,
        ReservationStatus status,
        LocalDateTime createdAt
) {}
