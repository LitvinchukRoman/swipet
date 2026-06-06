package ua.edu.ukma.swipet.backend.booking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.auth.security.CurrentUser;
import ua.edu.ukma.swipet.backend.booking.dto.BookingReservationRequest;
import ua.edu.ukma.swipet.backend.booking.dto.BookingReservationResponse;
import ua.edu.ukma.swipet.backend.booking.dto.BookingSlotRequest;
import ua.edu.ukma.swipet.backend.booking.dto.BookingSlotResponse;
import ua.edu.ukma.swipet.backend.booking.service.BookingService;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/shelters/{shelterId}/slots")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public BookingSlotResponse createSlot(
            @PathVariable Long shelterId,
            @Valid @RequestBody BookingSlotRequest request) {
        return bookingService.createSlot(shelterId, request);
    }

    @GetMapping("/shelters/{shelterId}/slots")
    @ResponseStatus(HttpStatus.OK)
    public List<BookingSlotResponse> getAvailableSlots(
            @PathVariable Long shelterId) {
        return bookingService.getAvailableSlots(shelterId);
    }

    @PostMapping("/slots/{slotId}/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingReservationResponse bookSlot(
            @CurrentUser AuthenticatedUser currentUser,
            @PathVariable Long slotId,
            @Valid @RequestBody BookingReservationRequest request) {
        return bookingService.bookSlot(currentUser.id(), slotId, request);
    }
}