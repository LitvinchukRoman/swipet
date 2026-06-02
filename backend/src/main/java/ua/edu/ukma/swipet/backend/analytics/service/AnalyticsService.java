package ua.edu.ukma.swipet.backend.analytics.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.analytics.dto.AnimalAnalyticsResponse;
import ua.edu.ukma.swipet.backend.analytics.entity.AnimalAnalytics;
import ua.edu.ukma.swipet.backend.analytics.entity.AnimalAnalyticsId;
import ua.edu.ukma.swipet.backend.analytics.repository.AnimalAnalyticsRepository;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.entity.AnimalStatus;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnimalAnalyticsRepository analyticsRepository;
    private final AnimalRepository animalRepository;

    @Transactional
    public void incrementView(Long animalId) {
        LocalDate today = LocalDate.now();
        AnimalAnalyticsId id = new AnimalAnalyticsId(animalId, today);

        analyticsRepository.findById(id).ifPresentOrElse(
                stat -> stat.setViewsCount(stat.getViewsCount() + 1),
                () -> {
                    Animal animalProxy = animalRepository.getReferenceById(animalId);
                    
                    AnimalAnalytics newStat = AnimalAnalytics.builder()
                            .id(id)
                            .animal(animalProxy)
                            .viewsCount(1)
                            .build();
                    analyticsRepository.save(newStat);
                }
        );
    }

    @Transactional(readOnly = true)
    public List<AnimalAnalyticsResponse> getAnalyticsByShelter(Long shelterId, LocalDate dateFrom, LocalDate dateTo) {
        LocalDate start = dateFrom != null ? dateFrom : LocalDate.now().minusDays(7);
        LocalDate end = dateTo != null ? dateTo : LocalDate.now();

        return analyticsRepository.findAnalyticsByShelterAndDateRange(shelterId, start, end)
                .stream()
                .map(stat -> new AnimalAnalyticsResponse(
                        stat.getAnimal().getId(),
                        stat.getAnimal().getName(),
                        stat.getId().getDate(),
                        stat.getViewsCount(),
                        stat.getSwipesRight(),
                        stat.getSwipesLeft(),
                        stat.getChatOpens()
                ))
                .collect(Collectors.toList());
    }

    @Scheduled(cron = "0 1 0 * * *")
    @Transactional
    public void aggregateDaily() {
        log.info("Запуск нічної агрегації статистики тварин...");
        LocalDate today = LocalDate.now();

        List<Animal> activeAnimals = animalRepository.findAllByStatus(AnimalStatus.AVAILABLE);
        
        for (Animal animal : activeAnimals) {
            AnimalAnalyticsId id = new AnimalAnalyticsId(animal.getId(), today);
            
            if (!analyticsRepository.existsById(id)) {
                AnimalAnalytics emptyStat = AnimalAnalytics.builder()
                        .id(id)
                        .animal(animal)
                        .build();
                analyticsRepository.save(emptyStat);
            }
        }
        log.info("Нічна агрегація завершена. Підготовлено записів: {}", activeAnimals.size());
    }
}