package ua.edu.ukma.swipet.backend.booking.dto;

import jakarta.validation.constraints.Size;

public record BookingReservationRequest(
        @Size(max = 500, message = "Нотатка не може перевищувати 500 символів")
        String notes
) {}