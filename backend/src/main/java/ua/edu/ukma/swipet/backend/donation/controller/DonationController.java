package ua.edu.ukma.swipet.backend.donation.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
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
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody DonationRequest request) {
        
        String paymentUrl = donationService.createOneTimeDonation(userId, request);
        return Map.of("paymentUrl", paymentUrl);
    }

    @PostMapping("/guardianship")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> createGuardianship(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody GuardianshipRequest request) {
        
        String paymentUrl = donationService.createGuardianship(userId, request);
        return Map.of("paymentUrl", paymentUrl);
    }

    @DeleteMapping("/guardianship/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelGuardianship(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        
        donationService.cancelGuardianship(userId, id);
    }

    @GetMapping("/my-guardianships")
    @ResponseStatus(HttpStatus.OK)
    public List<VirtualGuardianshipResponse> getMyGuardianships(
            @RequestHeader("X-User-Id") Long userId) {
        
        return donationService.getMyGuardianships(userId);
    }

    @PostMapping("/webhook")
    @ResponseStatus(HttpStatus.OK)
    public void processWebhook(@RequestBody WebhookPayload payload) {
        donationService.processWebhook(payload);
    }
}