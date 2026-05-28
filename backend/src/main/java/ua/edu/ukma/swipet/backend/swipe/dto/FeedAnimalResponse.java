package ua.edu.ukma.swipet.backend.swipe.dto;

public record FeedAnimalResponse(
        Long id,
        String name,
        String species,
        Integer ageMonths,
        String size,
        String primaryPhotoUrl,
        String shelterName,
        Double distanceKm
) {}