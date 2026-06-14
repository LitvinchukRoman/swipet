package ua.edu.ukma.swipet.backend.animal.mapper;

import org.springframework.stereotype.Component;
import ua.edu.ukma.swipet.backend.animal.dto.AnimalRequest;
import ua.edu.ukma.swipet.backend.animal.dto.AnimalResponse;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.entity.AnimalStatus;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;

@Component
public class AnimalMapper {

    public Animal toEntity(AnimalRequest request, Shelter shelter) {
        return Animal.builder()
                .shelter(shelter)
                .name(request.name())
                .species(request.species())
                .breed(request.breed())
                .ageMonths(request.ageMonths())
                .size(request.size())
                .gender(request.gender())
                .description(request.description())
                .isVaccinated(request.isVaccinated())
                .isSterilized(request.isSterilized())
                .status(request.status() != null ? request.status() : AnimalStatus.AVAILABLE)
                .build();
    }

    public AnimalResponse toResponse(Animal animal) {
        return new AnimalResponse(
                animal.getId(),
                animal.getShelter().getId(),
                animal.getName(),
                animal.getSpecies(),
                animal.getBreed(),
                animal.getAgeMonths(),
                animal.getSize(),
                animal.getGender(),
                animal.getDescription(),
                animal.getIsVaccinated(),
                animal.getIsSterilized(),
                animal.getStatus(),
                animal.getPrimaryPhotoUrl(),
                animal.getCreatedAt()
        );
    }
}