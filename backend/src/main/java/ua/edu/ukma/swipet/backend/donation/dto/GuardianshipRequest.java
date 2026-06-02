package ua.edu.ukma.swipet.backend.donation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record GuardianshipRequest(
        @NotNull(message = "ID тварини є обов'язковим")
        Long animalId,

        @NotNull(message = "Сума підписки є обов'язковою")
        @DecimalMin(value = "50.00", message = "Мінімальна сума опікунства - 50 грн/міс")
        BigDecimal monthlyAmount
) {}