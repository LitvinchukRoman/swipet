package ua.edu.ukma.swipet.backend.donation.dto;

public record PaymentInitResponse(
        String paymentUrl,
        String externalTxId
) {}