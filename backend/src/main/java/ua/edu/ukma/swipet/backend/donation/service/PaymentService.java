package ua.edu.ukma.swipet.backend.donation.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ua.edu.ukma.swipet.backend.donation.config.StripeProperties;
import ua.edu.ukma.swipet.backend.donation.dto.PaymentInitResponse;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final StripeProperties stripeProperties;

    @Value("${stripe.api-key}")
    private String stripeApiKey;

    @Value("${app.frontend-url:http://localhost:8081}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeProperties.apiKey();
        log.info("Stripe API ініціалізовано");
    }

    public PaymentInitResponse initPayment(BigDecimal amount, String description) {
        try {
            long amountInCents = amount.multiply(new BigDecimal("100")).longValue();

            SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/payment-success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/payment-cancel")
                .addLineItem(
                    SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("uah")
                                .setUnitAmount(amountInCents)
                                .setProductData(
                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(description)
                                        .build()
                                )
                                .build()
                        )
                        .build()
                )
                .build();

            Session session = Session.create(params);

            log.info("Успішно створено Stripe Checkout Session: {}", session.getId());

            return new PaymentInitResponse(session.getUrl(), session.getId());

        } catch (StripeException e) {
            log.error("Помилка ініціалізації платежу Stripe: {}", e.getMessage());
            throw new RuntimeException("Не вдалося створити платіжну сесію. Спробуйте пізніше.");
        }
    }
}