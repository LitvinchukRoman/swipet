package ua.edu.ukma.swipet.backend.booking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record BookingSlotRequest(
        @NotNull(message = "Час початку є обов'язковим")
        @Future(message = "Час початку має бути в майбутньому")
        LocalDateTime startTime,

        @NotNull(message = "Час завершення є обов'язковим")
        @Future(message = "Час завершення має бути в майбутньому")
        LocalDateTime endTime,

        @NotNull(message = "Максимальна кількість гостей є обов'язковою")
        @Min(value = 1, message = "Мінімум 1 гість")
        Integer maxGuests
) {}