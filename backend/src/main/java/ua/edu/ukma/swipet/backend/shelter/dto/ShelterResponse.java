package ua.edu.ukma.swipet.backend.shelter.dto;

import java.time.LocalDateTime;

public record ShelterResponse(
        Long id,
        Long adminUserId,
        String name,
        String description,
        String logoUrl,
        String address,
        String city,
        Double locationLat,
        Double locationLng,
        String phone,
        String websiteUrl,
        Boolean isVerified,
        LocalDateTime createdAt
) {}