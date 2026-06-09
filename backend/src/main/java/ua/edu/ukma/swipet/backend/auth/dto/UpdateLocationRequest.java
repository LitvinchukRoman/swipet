package ua.edu.ukma.swipet.backend.auth.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** PATCH /api/v1/users/me/location — оновлення геолокації користувача. */
public record UpdateLocationRequest(
        @NotNull(message = "Широта є обов'язковою")
        BigDecimal lat,

        @NotNull(message = "Довгота є обов'язковою")
        BigDecimal lng
) {}
