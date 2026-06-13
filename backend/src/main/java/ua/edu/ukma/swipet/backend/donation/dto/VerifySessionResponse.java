package ua.edu.ukma.swipet.backend.donation.dto;

/**
 * Відповідь на GET /donations/verify-session.
 * Серіалізується як { "status": "success" | "pending" | "failed" } —
 * контракт, який очікує фронтенд (donationService.verifySession).
 */
public record VerifySessionResponse(PaymentVerificationStatus status) {

    public static VerifySessionResponse of(PaymentVerificationStatus status) {
        return new VerifySessionResponse(status);
    }
}
