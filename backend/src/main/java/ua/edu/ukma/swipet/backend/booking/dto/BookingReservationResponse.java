package ua.edu.ukma.swipet.backend.booking.dto;

import ua.edu.ukma.swipet.backend.booking.entity.ReservationStatus;
import java.time.LocalDateTime;

public record BookingReservationResponse(
        Long id,
        Long slotId,
        Long userId,
        String notes,
        ReservationStatus status,
        LocalDateTime slotStartTime,
        LocalDateTime slotEndTime
) {}