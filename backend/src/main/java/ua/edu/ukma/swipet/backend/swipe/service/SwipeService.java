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

/**
 * Сервіс для реєстрації та управління реакціями (свайпами) користувачів на анкет тварин.
 * Також оновлює статистику аналітики притулків при кожному свайпі.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SwipeService {

    private final SwipeRepository swipeRepository;
    private final AnimalRepository animalRepository;
    private final AnalyticsService analyticsService;
    private final ua.edu.ukma.swipet.backend.auth.repository.UserRepository userRepository;

    /**
     * Фіксує реакцію користувача (лайк або дизлайк) на анкету тварини.
     * Запобігає повторним свайпам та оновлює метрики аналітики.
     *
     * @param userId ID користувача, який здійснює реакцію
     * @param request Запит із ID тварини та напрямком свайпу (LEFT / RIGHT)
     * @return Мапа з ID створеного запису свайпу
     * @throws AppException.conflict якщо користувач уже реагував на цю анкету
     */
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
            // Запобігання дублюванню записів при швидких повторних кліках (Race Condition)
            log.warn("Спрацював захист від Race Condition: користувач {} вже свайпнув тварину {}",
                userId, request.animalId());

            throw AppException.conflict("Ви вже відреагували на цю анкету");
        }

        // Оновлюємо метрики притулку (лайк чи дизлайк)
        analyticsService.incrementSwipe(request.animalId(), request.direction() == SwipeDirection.RIGHT);

        return Map.of("swipeId", savedSwipe.getId());
    }

    /**
     * Повністю очищує історію свайпів (реакцій) користувача.
     * Використовується для повторного відображення раніше переглянутих карток у стрічці.
     *
     * @param userId ID користувача
     */
    @Transactional
    public void resetSwipes(Long userId) {
        swipeRepository.deleteByUserId(userId);
    }
}