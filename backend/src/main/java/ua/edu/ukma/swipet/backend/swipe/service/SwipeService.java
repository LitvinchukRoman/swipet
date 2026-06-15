package ua.edu.ukma.swipet.backend.swipe.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.analytics.service.AnalyticsService;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.swipe.dto.SwipeRequest;
import ua.edu.ukma.swipet.backend.swipe.entity.Swipe;
import ua.edu.ukma.swipet.backend.swipe.entity.SwipeDirection;
import ua.edu.ukma.swipet.backend.swipe.repository.SwipeRepository;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SwipeService {

    private final SwipeRepository swipeRepository;
    private final AnimalRepository animalRepository;
    private final AnalyticsService analyticsService;


    private final ua.edu.ukma.swipet.backend.auth.repository.UserRepository userRepository;

    @Transactional
    public Map<String, Long> recordSwipe(Long userId, SwipeRequest request) {
        if (swipeRepository.existsByUserIdAndAnimalId(userId, request.animalId())) {
            throw AppException.conflict("Ви вже свайпнули цю тварину");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Користувача не знайдено"));
        
        Animal animal = animalRepository.findById(request.animalId())
                .orElseThrow(() -> AppException.notFound("Тварину не знайдено"));

        Swipe swipe = Swipe.builder()
                .user(user)
                .animal(animal)
                .direction(request.direction())
                .build();

        Swipe savedSwipe;

        try {
            savedSwipe = swipeRepository.save(swipe);
        } catch (DataIntegrityViolationException e) {
            log.warn("Спрацював захист від Race Condition: користувач {} вже свайпнув тварину {}",
                userId, request.animalId());

            throw AppException.conflict("Ви вже відреагували на цю анкету");
        }

        // Аналітика притулку: свайп вправо/вліво
        analyticsService.incrementSwipe(request.animalId(), request.direction() == SwipeDirection.RIGHT);

        return Map.of("swipeId", savedSwipe.getId());
    }

    @Transactional
    public void resetSwipes(Long userId) {
        swipeRepository.deleteByUserId(userId);
    }
}