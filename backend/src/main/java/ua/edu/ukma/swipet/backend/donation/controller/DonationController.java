package ua.edu.ukma.swipet.backend.donation.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.auth.security.CurrentUser;
import ua.edu.ukma.swipet.backend.donation.dto.DonationRequest;
import ua.edu.ukma.swipet.backend.donation.dto.GuardianshipRequest;
import ua.edu.ukma.swipet.backend.donation.dto.VirtualGuardianshipResponse;
import ua.edu.ukma.swipet.backend.donation.dto.WebhookPayload;
import ua.edu.ukma.swipet.backend.donation.service.DonationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    @PostMapping("/one-time")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> createOneTimeDonation(
        @CurrentUser AuthenticatedUser currentUser,
        @Valid @RequestBody DonationRequest request) {

        String paymentUrl = donationService.createOneTimeDonation(currentUser.id(), request);
        return Map.of("paymentUrl", paymentUrl);
    }

    @PostMapping("/guardianship")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> createGuardianship(
        @CurrentUser AuthenticatedUser currentUser,
        @Valid @RequestBody GuardianshipRequest request) {

        String paymentUrl = donationService.createGuardianship(currentUser.id(), request);
        return Map.of("paymentUrl", paymentUrl);
    }

    @DeleteMapping("/guardianship/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelGuardianship(
        @CurrentUser AuthenticatedUser currentUser,
        @PathVariable Long id) {

        donationService.cancelGuardianship(currentUser.id(), id);
    }

    @GetMapping("/my-guardianships")
    @ResponseStatus(HttpStatus.OK)
    public List<VirtualGuardianshipResponse> getMyGuardianships(
        @CurrentUser AuthenticatedUser currentUser) {

        return donationService.getMyGuardianships(currentUser.id());
    }

    @PostMapping("/webhook")
    @ResponseStatus(HttpStatus.OK)
    public void processWebhook(
        @RequestBody String payload,
        @RequestHeader("Stripe-Signature") String sigHeader) {
        donationService.processWebhook(payload, sigHeader);
    }
}