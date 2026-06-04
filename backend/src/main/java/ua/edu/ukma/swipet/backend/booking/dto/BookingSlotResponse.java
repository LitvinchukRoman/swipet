package ua.edu.ukma.swipet.backend.booking.dto;

import java.time.LocalDateTime;

public record BookingSlotResponse(
        Long id,
        Long shelterId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer maxGuests,
        Long bookedCount
) {}