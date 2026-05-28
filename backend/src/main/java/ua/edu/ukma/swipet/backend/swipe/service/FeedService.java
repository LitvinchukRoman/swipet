package ua.edu.ukma.swipet.backend.swipe.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.swipe.dto.FeedAnimalResponse;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final AnimalRepository animalRepository;

    @Transactional(readOnly = true)
    public List<FeedAnimalResponse> getFeed(
            Long userId, Double lat, Double lng, Double radiusKm, 
            String species, String size, Integer ageMax, Integer limit) {
        
        // Встановлюємо дефолтні значення, якщо клієнт їх не передав
        double searchRadius = radiusKm != null ? radiusKm : 50.0;
        int fetchLimit = limit != null ? limit : 20;

        return animalRepository.findFeedAnimals(
                userId, lat, lng, searchRadius, species, size, ageMax, fetchLimit
        ).stream()
         .map(proj -> new FeedAnimalResponse(
                 proj.getId(),
                 proj.getName(),
                 proj.getSpecies(),
                 proj.getAgeMonths(),
                 proj.getSize(),
                 proj.getPrimaryPhotoUrl(),
                 proj.getShelterName(),
                 // Округлюємо дистанцію до одного знака після коми
                 Math.round(proj.getDistanceKm() * 10.0) / 10.0
         ))
         .collect(Collectors.toList());
    }
}