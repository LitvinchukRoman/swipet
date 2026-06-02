package ua.edu.ukma.swipet.backend.donation.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ua.edu.ukma.swipet.backend.donation.dto.PaymentInitResponse;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
public class PaymentService {

    public PaymentInitResponse initPayment(BigDecimal amount, String description) {
        String externalTxId = "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        String fakePaymentUrl = "https://pay.swipet.ua/checkout/" + externalTxId + "?amount=" + amount;
        
        log.info("Ініційовано платіж на суму {}. Очікування оплати за посиланням: {}", amount, fakePaymentUrl);
        
        return new PaymentInitResponse(fakePaymentUrl, externalTxId);
    }
}