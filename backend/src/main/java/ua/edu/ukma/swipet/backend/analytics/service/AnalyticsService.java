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
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;
import ua.edu.ukma.swipet.backend.shelter.repository.ShelterRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnimalAnalyticsRepository analyticsRepository;
    private final AnimalRepository animalRepository;
    private final ShelterRepository shelterRepository;

    /**
     * Інкремент свайпу вправо/вліво. Свайп означає, що користувач реально побачив
     * картку, тож це і є «перегляд» — тому тут же піднімаємо viewsCount. Завдяки
     * unique-констрейнту свайпів (user+animal) кожен глядач рахується лише один раз,
     * без накрутки від повторних завантажень/префетчів стрічки.
     */
    @Transactional
    public void incrementSwipe(Long animalId, boolean liked) {
        bump(animalId, stat -> {
            stat.setViewsCount(stat.getViewsCount() + 1);
            if (liked) {
                stat.setSwipesRight(stat.getSwipesRight() + 1);
            } else {
                stat.setSwipesLeft(stat.getSwipesLeft() + 1);
            }
        });
    }

    /** Інкремент відкриттів чату (chat_opens). */
    @Transactional
    public void incrementChatOpen(Long animalId) {
        bump(animalId, stat -> stat.setChatOpens(stat.getChatOpens() + 1));
    }

    /**
     * Знаходить (або створює) денний запис аналітики тварини та застосовує мутатор.
     * Для нового запису всі лічильники стартують з 0 (Builder.Default), далі мутатор їх піднімає.
     */
    private void bump(Long animalId, java.util.function.Consumer<AnimalAnalytics> mutator) {
        LocalDate today = LocalDate.now();
        AnimalAnalyticsId id = new AnimalAnalyticsId(animalId, today);

        analyticsRepository.findById(id).ifPresentOrElse(
                mutator,
                () -> {
                    Animal animalProxy = animalRepository.getReferenceById(animalId);
                    AnimalAnalytics newStat = AnimalAnalytics.builder()
                            .id(id)
                            .animal(animalProxy)
                            .build();
                    mutator.accept(newStat);
                    analyticsRepository.save(newStat);
                }
        );
    }

    /** Резолвить притулок поточного адміна та повертає його аналітику. */
    @Transactional(readOnly = true)
    public List<AnimalAnalyticsResponse> getAnalyticsForAdmin(Long adminUserId, LocalDate dateFrom, LocalDate dateTo) {
        Shelter shelter = shelterRepository.findByAdminUser_Id(adminUserId)
                .orElseThrow(() -> AppException.notFound("Притулок для поточного користувача не знайдено"));
        return getAnalyticsByShelter(shelter.getId(), dateFrom, dateTo);
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