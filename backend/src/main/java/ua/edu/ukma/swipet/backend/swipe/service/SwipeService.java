package ua.edu.ukma.swipet.backend.swipe.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository; // Тимчасова заглушка знадобиться
import ua.edu.ukma.swipet.backend.swipe.dto.SwipeRequest;
import ua.edu.ukma.swipet.backend.swipe.entity.Swipe;
import ua.edu.ukma.swipet.backend.swipe.repository.SwipeRepository;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class SwipeService {

    private final SwipeRepository swipeRepository;
    private final AnimalRepository animalRepository;
    
    private final ua.edu.ukma.swipet.backend.auth.repository.UserRepository userRepository;

    @Transactional
    public Map<String, Long> recordSwipe(Long userId, SwipeRequest request) {
        if (swipeRepository.existsByUserIdAndAnimalId(userId, request.animalId())) {
            throw new RuntimeException("Ви вже свайпнули цю тварину");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));
        
        Animal animal = animalRepository.findById(request.animalId())
                .orElseThrow(() -> new RuntimeException("Тварину не знайдено"));

        Swipe swipe = Swipe.builder()
                .user(user)
                .animal(animal)
                .direction(request.direction())
                .build();

        Swipe savedSwipe = swipeRepository.save(swipe);

        return Map.of("swipeId", savedSwipe.getId());
    }
}