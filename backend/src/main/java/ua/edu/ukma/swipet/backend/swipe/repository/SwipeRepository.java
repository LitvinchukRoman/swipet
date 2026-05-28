package ua.edu.ukma.swipet.backend.swipe.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.swipe.entity.Swipe;

@Repository
public interface SwipeRepository extends JpaRepository<Swipe, Long> {
    boolean existsByUserIdAndAnimalId(Long userId, Long animalId);
}