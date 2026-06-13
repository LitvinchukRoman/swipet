package ua.edu.ukma.swipet.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stripe.model.Event;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.donation.config.StripeProperties;
import ua.edu.ukma.swipet.backend.donation.dto.PaymentInitResponse;
import ua.edu.ukma.swipet.backend.donation.dto.PaymentVerificationStatus;
import ua.edu.ukma.swipet.backend.donation.service.PaymentService;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

@TestConfiguration
public class TestConfig {

    @Bean
    @Primary
    public StripeProperties testStripeProperties() {
        return new StripeProperties("test_api_key", "test_webhook_secret");
    }

    @Bean
    @Primary
    public PaymentService testPaymentService() {
        PaymentService mockService = Mockito.mock(PaymentService.class);
        Mockito.when(mockService.initPayment(any(), anyString()))
            .thenReturn(new PaymentInitResponse("https://test.stripe.com/pay/test", "test_session_123"));

        // Валідний підпис → подія нерелевантного типу (обробник просто ігнорує її та повертає 200).
        Event ignoredEvent = Mockito.mock(Event.class);
        Mockito.when(ignoredEvent.getType()).thenReturn("payment_intent.created");
        Mockito.when(mockService.verifyWebhook(anyString(), anyString())).thenReturn(ignoredEvent);
        // Невалідний підпис → 401, як і реальна перевірка Stripe.
        Mockito.when(mockService.verifyWebhook(eq("invalid_payload"), anyString()))
            .thenThrow(AppException.unauthorized("Недійсний підпис вебхуку. Доступ заборонено."));
        // verify-session: за замовчуванням сесія оплачена.
        Mockito.when(mockService.getCheckoutStatus(anyString()))
            .thenReturn(PaymentVerificationStatus.SUCCESS);
        return mockService;
    }

    @Bean
    @Primary
    public ObjectMapper testObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
