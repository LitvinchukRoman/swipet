package ua.edu.ukma.swipet.backend.swipe.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.animal.mapper.AnimalMapper;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.swipe.dto.FeedAnimalResponse;

import java.util.List;
import java.util.stream.Collectors;
import ua.edu.ukma.swipet.backend.swipe.repository.SwipeRepository;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final AnimalRepository animalRepository;
    private final AnimalMapper animalMapper;
    private final SwipeRepository swipeRepository;

    @Transactional(readOnly = true)
    public List<FeedAnimalResponse> getFeed(
            Long userId, Double lat, Double lng, Double radiusKm, 
            String species, String size, Integer ageMax, Integer limit) {
        
        // Встановлюємо дефолтні значення, якщо клієнт їх не передав.
        // limit клампимо в [1..100]: негативний LIMIT валить SQL (500), а
        // надто великий — захист від важких запитів.
        double searchRadius = radiusKm != null && radiusKm > 0 ? radiusKm : 50.0;
        int fetchLimit = (limit != null && limit > 0) ? Math.min(limit, 100) : 20;

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

    @Transactional(readOnly = true)
    public List<ua.edu.ukma.swipet.backend.animal.dto.AnimalResponse> getLikedAnimals(
        Long userId, Integer page, Integer limit) {

        // Пагінація у Spring Data JPA починається з 0, а клієнти зазвичай передають сторінку 1
        int pageNumber = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (limit != null && limit > 0) ? limit : 20;

        org.springframework.data.domain.Pageable pageable =
            org.springframework.data.domain.PageRequest.of(pageNumber, pageSize);

        return swipeRepository.findLikedAnimalsByUserId(
                userId,
                ua.edu.ukma.swipet.backend.swipe.entity.SwipeDirection.RIGHT,
                pageable
            )
            .stream()
            .map(animalMapper::toResponse)
            .collect(Collectors.toList());
    }
}