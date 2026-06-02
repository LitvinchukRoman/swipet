package ua.edu.ukma.swipet.backend.analytics.dto;

import java.time.LocalDate;

public record AnimalAnalyticsResponse(
        Long animalId,
        String animalName,
        LocalDate date,
        Integer viewsCount,
        Integer swipesRight,
        Integer swipesLeft,
        Integer chatOpens
) {}