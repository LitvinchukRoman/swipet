package ua.edu.ukma.swipet.backend.donation.dto;

public record WebhookPayload(
        String externalTxId,
        String status
) {}