package ua.edu.ukma.swipet.backend.swipe.dto;

import jakarta.validation.constraints.NotNull;
import ua.edu.ukma.swipet.backend.swipe.entity.SwipeDirection;

public record SwipeRequest(
        @NotNull(message = "ID тварини є обов'язковим")
        Long animalId,
        
        @NotNull(message = "Напрямок свайпу є обов'язковим")
        SwipeDirection direction
) {}