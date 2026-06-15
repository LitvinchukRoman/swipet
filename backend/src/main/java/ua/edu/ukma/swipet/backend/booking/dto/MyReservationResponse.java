package ua.edu.ukma.swipet.backend.booking.dto;

import ua.edu.ukma.swipet.backend.booking.entity.ReservationStatus;

import java.time.LocalDateTime;

/** Бронювання поточного користувача (GET /me/reservations) — з контекстом притулку. */
public record MyReservationResponse(
        Long id,
        Long slotId,
        Long shelterId,
        String shelterName,
        LocalDateTime slotStartTime,
        LocalDateTime slotEndTime,
        ReservationStatus status,
        String notes
) {}
