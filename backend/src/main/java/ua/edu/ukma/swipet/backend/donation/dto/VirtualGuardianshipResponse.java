package ua.edu.ukma.swipet.backend.donation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VirtualGuardianshipResponse(
        Long id,
        Long animalId,
        String animalName,
        String animalPrimaryPhotoUrl,
        BigDecimal monthlyAmount,
        Boolean isActive,
        LocalDateTime startedAt,
        LocalDateTime nextBillingAt
) {}