package ua.edu.ukma.swipet.backend.donation.dto;

import ua.edu.ukma.swipet.backend.animal.entity.Species;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VirtualGuardianshipResponse(
        Long id,
        Long animalId,
        String animalName,
        String animalPrimaryPhotoUrl,
        Species animalSpecies,
        String animalBreed,
        BigDecimal monthlyAmount,
        Boolean isActive,
        LocalDateTime startedAt,
        LocalDateTime nextBillingAt
) {}