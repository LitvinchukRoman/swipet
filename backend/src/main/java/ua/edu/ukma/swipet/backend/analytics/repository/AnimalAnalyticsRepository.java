package ua.edu.ukma.swipet.backend.analytics.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.analytics.entity.AnimalAnalytics;
import ua.edu.ukma.swipet.backend.analytics.entity.AnimalAnalyticsId;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnimalAnalyticsRepository extends JpaRepository<AnimalAnalytics, AnimalAnalyticsId> {

    @Query("SELECT a FROM AnimalAnalytics a WHERE a.animal.shelter.id = :shelterId AND a.id.date BETWEEN :dateFrom AND :dateTo")
    List<AnimalAnalytics> findAnalyticsByShelterAndDateRange(
        @Param("shelterId") Long shelterId,
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo
    );
}