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
import ua.edu.ukma.swipet.backend.auth.entity.Role;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.booking.dto.MyReservationResponse;
import ua.edu.ukma.swipet.backend.booking.dto.SlotReservationResponse;
import ua.edu.ukma.swipet.backend.common.security.ShelterOwnershipGuard;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Сервіс для управління розкладом візитів (Booking Slots) та бронюванням візитів користувачами.
 * Містить логіку запобігання накладання слотів, захисту від овербукінгу за допомогою write-lock
 * та розмежування прав при скасуванні/видаленні.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingSlotRepository slotRepository;
    private final BookingReservationRepository reservationRepository;
    private final ShelterRepository shelterRepository;
    private final UserRepository userRepository;
    private final ShelterOwnershipGuard ownershipGuard;

    /**
     * Створює новий часовий слот для візитів у притулок.
     * Запобігає створенню слотів, які перетинаються в часі для одного й того ж притулку.
     *
     * @param shelterId ID притулку
     * @param request Параметри слоту (час початку, завершення, максимальна кількість гостей)
     * @return Створений слот візиту
     * @throws AppException.badRequest якщо час початку більший або дорівнює часу завершення
     * @throws AppException.conflict якщо слот перетинається за часом з іншим наявним слотом притулку
     */
    @Transactional
    public BookingSlotResponse createSlot(Long shelterId, BookingSlotRequest request) {
        if (request.startTime().isAfter(request.endTime()) || request.startTime().isEqual(request.endTime())) {
            throw AppException.badRequest("Час початку має бути раніше часу завершення");
        }

        Shelter shelter = shelterRepository.findById(shelterId)
                .orElseThrow(() -> AppException.notFound("Притулок не знайдено"));

        // Перевірка перетину слотів у часі
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

    /**
     * Повертає список доступних майбутніх слотів для конкретного притулку разом із кількістю зайнятих місць.
     *
     * @param shelterId ID притулку
     * @return Список доступних слотів
     */
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

    /**
     * Бронює місце у часовому слоті притулку для користувача.
     * Використовує песимістичне блокування (write-lock) для запобігання овербукінгу
     * при одночасному бронюванні кількома користувачами.
     *
     * @param userId ID користувача
     * @param slotId ID часового слоту
     * @param request Додаткові примітки до бронювання
     * @return Інформація про створене бронювання
     * @throws AppException.badRequest якщо слот уже розпочався або минув
     * @throws AppException.conflict якщо всі місця в цьому слоті заброньовано
     */
    @Transactional
    public BookingReservationResponse bookSlot(Long userId, Long slotId, BookingReservationRequest request) {
        // Беремо слот під write-локом (SELECT ... FOR UPDATE), щоб конкурентні бронювання серіалізувались
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

    /**
     * Отримує список бронювань поточного користувача.
     *
     * @param userId ID користувача
     * @return Список бронювань користувача
     */
    @Transactional(readOnly = true)
    public List<MyReservationResponse> getMyReservations(Long userId) {
        return reservationRepository.findAllByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(r -> {
                    BookingSlot slot = r.getSlot();
                    Shelter shelter = slot.getShelter();
                    return new MyReservationResponse(
                            r.getId(),
                            slot.getId(),
                            shelter.getId(),
                            shelter.getName(),
                            slot.getStartTime(),
                            slot.getEndTime(),
                            r.getStatus(),
                            r.getNotes()
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * Скасовує бронювання візиту (soft-delete → статус змінюється на CANCELLED).
     * Дозволено лише автору бронювання, адміністратору відповідного притулку або платформеному ADMIN.
     *
     * @param reservationId ID бронювання
     * @param authUserId ID поточного авторизованого користувача
     * @param authRole Роль поточного авторизованого користувача
     * @throws AppException.forbidden якщо у користувача немає прав на скасування цього бронювання
     */
    @Transactional
    public void cancelReservation(Long reservationId, Long authUserId, Role authRole) {
        BookingReservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> AppException.notFound("Бронювання не знайдено"));

        Shelter shelter = reservation.getSlot().getShelter();
        boolean isOwner = reservation.getUser().getId().equals(authUserId);
        boolean isShelterAdmin = authRole == Role.SHELTER_ADMIN
                && shelter.getAdminUser() != null
                && shelter.getAdminUser().getId().equals(authUserId);
        boolean isPlatformAdmin = authRole == Role.ADMIN;
        if (!isOwner && !isShelterAdmin && !isPlatformAdmin) {
            throw AppException.forbidden("Немає доступу до цього бронювання");
        }

        if (reservation.getStatus() == ReservationStatus.ACTIVE) {
            reservation.setStatus(ReservationStatus.CANCELLED);
        }
    }

    /**
     * Отримує список активних бронювань для конкретного слоту.
     * Дозволено лише для адміністраторів відповідного притулку.
     *
     * @param slotId ID часового слоту
     * @param currentUser Інформація про поточного авторизованого користувача
     * @return Список зареєстрованих візитерів на слот
     */
    @Transactional(readOnly = true)
    public List<SlotReservationResponse> getSlotReservations(Long slotId, AuthenticatedUser currentUser) {
        BookingSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> AppException.notFound("Слот не знайдено"));
        ownershipGuard.assertCanManageShelter(currentUser, slot.getShelter().getId());

        return reservationRepository.findBySlot_IdAndStatusOrderByCreatedAtAsc(slotId, ReservationStatus.ACTIVE).stream()
                .map(r -> new SlotReservationResponse(
                        r.getId(),
                        r.getUser().getId(),
                        r.getUser().getFullName(),
                        r.getUser().getEmail(),
                        r.getNotes(),
                        r.getStatus(),
                        r.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Видаляє часовий слот разом з усіма його бронюваннями.
     * Дозволено лише адміністратору відповідного притулку або платформеному ADMIN.
     *
     * @param slotId ID часового слоту
     * @param currentUser Інформація про поточного авторизованого користувача
     */
    @Transactional
    public void deleteSlot(Long slotId, AuthenticatedUser currentUser) {
        BookingSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> AppException.notFound("Слот не знайдено"));
        ownershipGuard.assertCanManageShelter(currentUser, slot.getShelter().getId());

        reservationRepository.deleteBySlot_Id(slotId); // прибираємо брони (FK), потім сам слот
        slotRepository.delete(slot);
    }
}