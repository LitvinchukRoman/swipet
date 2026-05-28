package ua.edu.ukma.swipet.backend.swipe.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.swipe.entity.Swipe;
import ua.edu.ukma.swipet.backend.swipe.entity.SwipeDirection;

@Repository
public interface SwipeRepository extends JpaRepository<Swipe, Long> {
    boolean existsByUserIdAndAnimalId(Long userId, Long animalId);

    @Query("SELECT s.animal FROM Swipe s WHERE s.user.id = :userId AND s.direction = :direction ORDER BY s.swipedAt DESC") java.util.List<Animal> findLikedAnimalsByUserId(
        @Param("userId") Long userId,
        @Param("direction") SwipeDirection direction,
        org.springframework.data.domain.Pageable pageable
    );
}