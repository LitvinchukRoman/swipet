package ua.edu.ukma.swipet.backend.animal.dto;

import ua.edu.ukma.swipet.backend.animal.entity.AnimalStatus;
import ua.edu.ukma.swipet.backend.animal.entity.Gender;
import ua.edu.ukma.swipet.backend.animal.entity.Size;
import ua.edu.ukma.swipet.backend.animal.entity.Species;

import java.time.LocalDateTime;
import java.util.List;

public record AnimalResponse(
        Long id,
        Long shelterId,
        String name,
        Species species,
        String breed,
        Integer ageMonths,
        Size size,
        Gender gender,
        String description,
        Boolean isVaccinated,
        Boolean isSterilized,
        AnimalStatus status,
        String primaryPhotoUrl,
        List<PhotoResponse> photos,
        LocalDateTime createdAt
) {}