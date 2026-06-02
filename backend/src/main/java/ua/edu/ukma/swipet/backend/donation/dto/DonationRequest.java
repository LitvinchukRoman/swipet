package ua.edu.ukma.swipet.backend.donation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record DonationRequest(
        @NotNull(message = "ID притулку є обов'язковим")
        Long shelterId,
        
        Long animalId,

        @NotNull(message = "Сума донату є обов'язковою")
        @DecimalMin(value = "10.00", message = "Мінімальна сума донату - 10 грн")
        BigDecimal amount
) {}