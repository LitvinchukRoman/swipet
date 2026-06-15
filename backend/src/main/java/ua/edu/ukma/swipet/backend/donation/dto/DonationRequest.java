package ua.edu.ukma.swipet.backend.donation.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record DonationRequest(
        // Притулок не обов'язковий, якщо вказано animalId — тоді він резолвиться з тварини
        // (клієнту не треба знати shelterId, щоб задонатити конкретній тварині).
        Long shelterId,

        Long animalId,

        @NotNull(message = "Сума донату є обов'язковою")
        @DecimalMin(value = "50.00", message = "Мінімальна сума донату - 50 грн")
        BigDecimal amount
) {
    /** Має бути вказано принаймні одне: притулок або тварина. */
    @AssertTrue(message = "Вкажіть притулок або тварину для донату")
    public boolean isTargetPresent() {
        return shelterId != null || animalId != null;
    }
}