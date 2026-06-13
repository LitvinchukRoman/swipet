package ua.edu.ukma.swipet.backend.donation.dto;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Узагальнений статус платіжної сесії, ізольований від Stripe SDK.
 * PaymentService мапить сирі поля Stripe (status / payment_status) у ці значення,
 * щоб DonationService та контролер не залежали від конкретного провайдера.
 * Серіалізується у lowercase ("success"/"pending"/"failed") — контракт фронтенду.
 */
public enum PaymentVerificationStatus {
    SUCCESS,
    PENDING,
    FAILED;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }
}
