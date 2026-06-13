package ua.edu.ukma.swipet.backend.booking.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.booking.entity.BookingSlot;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingSlotRepository extends JpaRepository<BookingSlot, Long> {
    
    @Query("SELECT s FROM BookingSlot s WHERE s.shelter.id = :shelterId AND s.startTime >= :now ORDER BY s.startTime ASC")
    List<BookingSlot> findFutureSlotsByShelter(@Param("shelterId") Long shelterId, @Param("now") LocalDateTime now);
    
    @Query("SELECT COUNT(s) > 0 FROM BookingSlot s WHERE s.shelter.id = :shelterId AND (s.startTime < :endTime AND s.endTime > :startTime)")
    boolean isSlotOverlapping(@Param("shelterId") Long shelterId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Завантажує слот під пессимістичним write-локом рядка (SELECT ... FOR UPDATE).
     * Серіалізує конкурентні бронювання того самого слота, щоб уникнути овербукінгу
     * (двоє читають count &lt; max і обоє вставляють).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM BookingSlot s WHERE s.id = :id")
    Optional<BookingSlot> findByIdForUpdate(@Param("id") Long id);
}