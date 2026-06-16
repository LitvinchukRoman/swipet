package ua.edu.ukma.swipet.backend.donation.service;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.donation.config.StripeProperties;
import ua.edu.ukma.swipet.backend.donation.dto.PaymentInitResponse;
import ua.edu.ukma.swipet.backend.donation.dto.PaymentVerificationStatus;

import java.math.BigDecimal;

/**
 * Сервіс для інтеграції з платіжною системою Stripe.
 * Дозволяє ініціалізувати платіжні сесії Checkout, верифікувати статуси сесій
 * та безпечно обробляти вхідні Stripe-вебхуки.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final StripeProperties stripeProperties;

    @Value("${stripe.api-key}")
    private String stripeApiKey;

    @Value("${app.frontend-url:http://localhost:8081}")
    private String frontendUrl;

    /**
     * Ініціалізує Stripe API після створення біна за допомогою налаштованих properties.
     */
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeProperties.apiKey();
        log.info("Stripe API ініціалізовано");
    }

    /**
     * Створює Stripe Checkout Session для оплати донату або опіки.
     *
     * @param amount Сума платежу (у гривнях)
     * @param description Опис призначення платежу (відображається користувачу на платіжній сторінці)
     * @return Об'єкт відповіді з платіжним лінком та ID сесії
     * @throws AppException.badRequest якщо Stripe API повертає помилку
     */
    public PaymentInitResponse initPayment(BigDecimal amount, String description) {
        try {
            // Stripe приймає суму в центах/копійках, тому множимо UAH на 100
            long amountInCents = amount.multiply(new BigDecimal("100")).longValue();

            SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                // {CHECKOUT_SESSION_ID} буде замінено Stripe на реальний ID сесії при редиректі
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
            throw AppException.badRequest("Не вдалося створити платіжну сесію. Спробуйте пізніше.");
        }
    }

    /**
     * Повертає узагальнений статус Stripe Checkout Session за її id.
     * Використовується ендпоінтом /verify-session, щоб після redirect показати
     * користувачу реальний результат, не чекаючи доставки вебхука.
     *
     * Мапінг сирих полів Stripe:
     *  - payment_status == "paid" | "no_payment_required" → SUCCESS
     *  - status == "expired"                              → FAILED
     *  - інакше (status "open", payment_status "unpaid")  → PENDING
     *
     * @param sessionId ID сесії Stripe Checkout
     * @return Внутрішній статус верифікації платежу (SUCCESS, FAILED, PENDING)
     */
    public PaymentVerificationStatus getCheckoutStatus(String sessionId) {
        try {
            Session session = Session.retrieve(sessionId);
            String paymentStatus = session.getPaymentStatus();
            String status = session.getStatus();

            if ("paid".equals(paymentStatus) || "no_payment_required".equals(paymentStatus)) {
                return PaymentVerificationStatus.SUCCESS;
            }
            if ("expired".equals(status)) {
                return PaymentVerificationStatus.FAILED;
            }
            return PaymentVerificationStatus.PENDING;

        } catch (StripeException e) {
            log.error("Не вдалося отримати Stripe-сесію {}: {}", sessionId, e.getMessage());
            throw AppException.badRequest("Не вдалося перевірити статус платежу.");
        }
    }

    /**
     * Верифікує автентичність Stripe-вебхука за допомогою HMAC-підпису та розпаршує подію.
     * Запобігає атакам підміни тіла запиту (Payload Replay Attacks).
     *
     * @param payload Сире тіло запиту (JSON-строка)
     * @param sigHeader Заголовок Stripe-Signature з підписом
     * @return Перевірений об'єкт події Stripe
     * @throws AppException.unauthorized якщо підпис недійсний
     */
    public Event verifyWebhook(String payload, String sigHeader) {
        try {
            return Webhook.constructEvent(payload, sigHeader, stripeProperties.webhookSecret());
        } catch (SignatureVerificationException e) {
            log.error("⚠️ Атака на вебхук або невірний підпис: {}", e.getMessage());
            throw AppException.unauthorized("Недійсний підпис вебхуку. Доступ заборонено.");
        }
    }
}