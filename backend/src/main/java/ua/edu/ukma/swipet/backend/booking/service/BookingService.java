package ua.edu.ukma.swipet.backend.booking.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.booking.dto.BookingReservationRequest;
import ua.edu.ukma.swipet.backend.booking.dto.BookingReservationResponse;
import ua.edu.ukma.swipet.backend.booking.dto.BookingSlotRequest;
import ua.edu.ukma.swipet.backend.booking.dto.BookingSlotResponse;
import ua.edu.ukma.swipet.backend.booking.entity.BookingReservation;
import ua.edu.ukma.swipet.backend.booking.entity.BookingSlot;
import ua.edu.ukma.swipet.backend.booking.entity.ReservationStatus;
import ua.edu.ukma.swipet.backend.booking.repository.BookingReservationRepository;
import ua.edu.ukma.swipet.backend.booking.repository.BookingSlotRepository;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;
import ua.edu.ukma.swipet.backend.shelter.repository.ShelterRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingSlotRepository slotRepository;
    private final BookingReservationRepository reservationRepository;
    private final ShelterRepository shelterRepository;
    private final UserRepository userRepository;

    @Transactional
    public BookingSlotResponse createSlot(Long shelterId, BookingSlotRequest request) {
        if (request.startTime().isAfter(request.endTime()) || request.startTime().isEqual(request.endTime())) {
            throw AppException.badRequest("Час початку має бути раніше часу завершення");
        }

        Shelter shelter = shelterRepository.findById(shelterId)
                .orElseThrow(() -> AppException.notFound("Притулок не знайдено"));

        boolean isOverlapping = slotRepository.isSlotOverlapping(shelterId, request.startTime(), request.endTime());
        if (isOverlapping) {
            throw AppException.conflict("Цей часовий слот перетинається з уже існуючим");
        }

        BookingSlot slot = BookingSlot.builder()
                .shelter(shelter)
                .startTime(request.startTime())
                .endTime(request.endTime())
                .maxGuests(request.maxGuests())
                .build();

        BookingSlot savedSlot = slotRepository.save(slot);

        return new BookingSlotResponse(
                savedSlot.getId(),
                savedSlot.getShelter().getId(),
                savedSlot.getStartTime(),
                savedSlot.getEndTime(),
                savedSlot.getMaxGuests(),
                0L
        );
    }

    @Transactional(readOnly = true)
    public List<BookingSlotResponse> getAvailableSlots(Long shelterId) {
        LocalDateTime now = LocalDateTime.now();
        List<BookingSlot> futureSlots = slotRepository.findFutureSlotsByShelter(shelterId, now);

        return futureSlots.stream().map(slot -> {
            long bookedCount = reservationRepository.countBySlot_IdAndStatus(slot.getId(), ReservationStatus.ACTIVE);
            return new BookingSlotResponse(
                    slot.getId(),
                    slot.getShelter().getId(),
                    slot.getStartTime(),
                    slot.getEndTime(),
                    slot.getMaxGuests(),
                    bookedCount
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public BookingReservationResponse bookSlot(Long userId, Long slotId, BookingReservationRequest request) {
        // Беремо слот під write-локом, щоб конкурентні бронювання серіалізувались
        // і сумарна кількість не перевищила maxGuests (захист від овербукінгу).
        BookingSlot slot = slotRepository.findByIdForUpdate(slotId)
                .orElseThrow(() -> AppException.notFound("Слот не знайдено"));

        if (slot.getStartTime().isBefore(LocalDateTime.now())) {
            throw AppException.badRequest("Неможливо забронювати слот, який вже розпочався або минув");
        }

        long currentBookings = reservationRepository.countBySlot_IdAndStatus(slotId, ReservationStatus.ACTIVE);
        if (currentBookings >= slot.getMaxGuests()) {
            throw AppException.conflict("На жаль, усі місця на цей час вже заброньовані");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Користувача не знайдено"));

        BookingReservation reservation = BookingReservation.builder()
                .slot(slot)
                .user(user)
                .notes(request.notes())
                .status(ReservationStatus.ACTIVE)
                .build();

        BookingReservation savedReservation = reservationRepository.save(reservation);

        return new BookingReservationResponse(
                savedReservation.getId(),
                slot.getId(),
                user.getId(),
                savedReservation.getNotes(),
                savedReservation.getStatus(),
                slot.getStartTime(),
                slot.getEndTime()
        );
    }
}