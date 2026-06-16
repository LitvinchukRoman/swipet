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

/**
 * Сервіс для роботи зі стрічкою анкет тварин (Feed) та вподобаннями користувача.
 * Реалізує бізнес-логіку фільтрації, гео-просторового пошуку та пагінації.
 */
@Service
@RequiredArgsConstructor
public class FeedService {

    private final AnimalRepository animalRepository;
    private final AnimalMapper animalMapper;
    private final SwipeRepository swipeRepository;

    /**
     * Отримує список анкет тварин для головного екрана (стрічки свайпів) з урахуванням гео-фільтрації,
     * а також фільтрів за видом, розміром, віком і вже переглянутими анкетами.
     *
     * @param userId ID поточного користувача (щоб виключити вже свайпнутих ним тварин)
     * @param lat Широта локації користувача для розрахунку відстані
     * @param lng Довгота локації користувача для розрахунку відстані
     * @param radiusKm Максимальний радіус пошуку в кілометрах (дефолт: 50.0 км)
     * @param species Вид тварини (напр., DOG, CAT)
     * @param size Розмір тварини (SMALL, MEDIUM, LARGE)
     * @param ageMax Максимальний вік тварини в місяцях
     * @param excludeIds Список ID тварин, які треба примусово виключити (напр., поточні завантажені картки)
     * @param limit Максимальна кількість записів у відповіді (обмежено від 1 до 100, дефолт: 20)
     * @return Список спрощених моделей тварин зі вказанням відстані в км
     */
    @Transactional(readOnly = true)
    public List<FeedAnimalResponse> getFeed(
            Long userId, Double lat, Double lng, Double radiusKm, 
            String species, String size, Integer ageMax, List<Long> excludeIds, Integer limit) {
        
        // Встановлюємо дефолтні значення, якщо клієнт їх не передав.
        // limit клампимо в [1..100]: негативний LIMIT валить SQL (500), а
        // надто великий — захист від важких запитів.
        double searchRadius = radiusKm != null && radiusKm > 0 ? radiusKm : 50.0;
        int fetchLimit = (limit != null && limit > 0) ? Math.min(limit, 100) : 20;
        
        // Порожній список у SQL-запиті IN (...) викличе синтаксичну помилку,
        // тому використовуємо дефолтне неіснуюче значення (-1L)
        List<Long> ignoreIds = (excludeIds != null && !excludeIds.isEmpty()) ? excludeIds : List.of(-1L);

        return animalRepository.findFeedAnimals(
                userId, lat, lng, searchRadius, species, size, ageMax, ignoreIds, fetchLimit
        ).stream()
         .map(proj -> new FeedAnimalResponse(
                 proj.getId(),
                 proj.getName(),
                 proj.getSpecies(),
                 proj.getAgeMonths(),
                 proj.getSize(),
                 proj.getPrimaryPhotoUrl(),
                 proj.getShelterId(),
                 proj.getShelterName(),
                 // Округлюємо дистанцію до одного знака після коми
                 Math.round(proj.getDistanceKm() * 10.0) / 10.0
         ))
         .collect(Collectors.toList());
    }

    /**
     * Отримує список вподобаних користувачем тварин (свайп RIGHT) з підтримкою пагінації.
     *
     * @param userId ID поточного користувача
     * @param page Номер сторінки, переданий клієнтом (1-індексований)
     * @param limit Ліміт кількості елементів на сторінку
     * @return Список повних анкет вподобаних тварин
     */
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