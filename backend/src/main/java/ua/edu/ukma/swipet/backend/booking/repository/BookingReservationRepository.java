package ua.edu.ukma.swipet.backend.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.booking.entity.BookingReservation;
import ua.edu.ukma.swipet.backend.booking.entity.ReservationStatus;

import java.util.List;

@Repository
public interface BookingReservationRepository extends JpaRepository<BookingReservation, Long> {
    
    long countBySlot_IdAndStatus(Long slotId, ReservationStatus status);

    List<BookingReservation> findAllByUser_IdOrderByCreatedAtDesc(Long userId);
}