package ua.edu.ukma.swipet.backend.admin.dto;

import jakarta.validation.constraints.NotNull;

public record VerifyShelterRequest(
        @NotNull(message = "Поле verified є обов'язковим")
        Boolean verified
) {}
