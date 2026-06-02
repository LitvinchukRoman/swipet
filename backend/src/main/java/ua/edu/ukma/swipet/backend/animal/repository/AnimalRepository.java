package ua.edu.ukma.swipet.backend.animal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;

import java.util.List;
import ua.edu.ukma.swipet.backend.animal.entity.AnimalStatus;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, Long> {

    @Query(value = """
            SELECT a.id AS id, 
                   a.name AS name, 
                   CAST(a.species AS text) AS species, 
                   a.age_months AS ageMonths, 
                   CAST(a.size AS text) AS size, 
                   a.primary_photo_url AS primaryPhotoUrl, 
                   s.name AS shelterName,
                   (6371 * acos(
                      cos(radians(:lat)) * cos(radians(s.location_lat)) *
                      cos(radians(s.location_lng) - radians(:lng)) +
                      sin(radians(:lat)) * sin(radians(s.location_lat))
                   )) AS distanceKm
            FROM animals a
            JOIN shelters s ON a.shelter_id = s.id
            WHERE a.status = 'AVAILABLE'
              AND (:species IS NULL OR CAST(a.species AS text) = :species)
              AND (:size IS NULL OR CAST(a.size AS text) = :size)
              AND (:ageMax IS NULL OR a.age_months <= :ageMax)
              AND NOT EXISTS (
                  SELECT 1 FROM swipes sw 
                  WHERE sw.animal_id = a.id AND sw.user_id = :userId
              )
              AND (6371 * acos(
                      cos(radians(:lat)) * cos(radians(s.location_lat)) *
                      cos(radians(s.location_lng) - radians(:lng)) +
                      sin(radians(:lat)) * sin(radians(s.location_lat))
                   )) <= :radiusKm
            ORDER BY distanceKm ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<FeedAnimalProjection> findFeedAnimals(
            @Param("userId") Long userId,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radiusKm") Double radiusKm,
            @Param("species") String species,
            @Param("size") String size,
            @Param("ageMax") Integer ageMax,
            @Param("limit") Integer limit
    );

    List<Animal> findAllByStatus(AnimalStatus animalStatus);
}