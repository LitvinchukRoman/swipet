package ua.edu.ukma.swipet.backend.donation.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;
import ua.edu.ukma.swipet.backend.AbstractIntegrationTest;
import ua.edu.ukma.swipet.backend.TestConfig;
import ua.edu.ukma.swipet.backend.auth.security.WithMockAuthenticatedUser;
import ua.edu.ukma.swipet.backend.donation.dto.DonationRequest;
import ua.edu.ukma.swipet.backend.donation.dto.GuardianshipRequest;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Sql("/data.sql")
@Import(TestConfig.class)
class DonationControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // @Test
    // @WithMockUser(username = "test@example.com", roles = "USER")
    // void createOneTimeDonation_Success_Returns201WithPaymentUrl() throws Exception {
    //     // Arrange
    //     DonationRequest request = new DonationRequest(1L, null, new BigDecimal("100.00"));
    //     PaymentInitResponse paymentInit = new PaymentInitResponse("https://stripe.com/pay/123", "session_123");
    //
    //     when(paymentService.initPayment(any(BigDecimal.class), anyString())).thenReturn(paymentInit);
    //
    //     // Act & Assert
    //     mockMvc.perform(post("/api/v1/donations/one-time")
    //             .contentType(MediaType.APPLICATION_JSON)
    //             .content(objectMapper.writeValueAsString(request)))
    //         .andExpect(status().isCreated())
    //         .andExpect(jsonPath("$.paymentUrl").value("https://stripe.com/pay/123"));
    // }

    // @Test
    // @WithMockUser(username = "test@example.com", roles = "USER")
    // void createOneTimeDonation_WithAnimal_Success_Returns201WithPaymentUrl() throws Exception {
    //     // Arrange
    //     DonationRequest request = new DonationRequest(1L, 1L, new BigDecimal("100.00"));
    //     PaymentInitResponse paymentInit = new PaymentInitResponse("https://stripe.com/pay/123", "session_123");
    //
    //     when(paymentService.initPayment(any(BigDecimal.class), anyString())).thenReturn(paymentInit);
    //
    //     // Act & Assert
    //     mockMvc.perform(post("/api/v1/donations/one-time")
    //             .contentType(MediaType.APPLICATION_JSON)
    //             .content(objectMapper.writeValueAsString(request)))
    //         .andExpect(status().isCreated())
    //         .andExpect(jsonPath("$.paymentUrl").value("https://stripe.com/pay/123"));
    // }

    @Test
    @WithMockUser(username = "test@example.com", roles = "USER")
    void createOneTimeDonation_InvalidAmount_Returns400() throws Exception {
        // Arrange
        DonationRequest request = new DonationRequest(1L, null, new BigDecimal("-10.00"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/donations/one-time")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = "USER")
    void createOneTimeDonation_MissingShelterId_Returns400() throws Exception {
        // Arrange
        DonationRequest request = new DonationRequest(null, null, new BigDecimal("100.00"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/donations/one-time")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    // @Test
    // @WithMockUser(username = "test@example.com", roles = "USER")
    // void createGuardianship_Success_Returns201WithPaymentUrl() throws Exception {
    //     // Arrange
    //     GuardianshipRequest request = new GuardianshipRequest(1L, new BigDecimal("50.00"));
    //     PaymentInitResponse paymentInit = new PaymentInitResponse("https://stripe.com/pay/123", "session_123");
    //
    //     when(paymentService.initPayment(any(BigDecimal.class), anyString())).thenReturn(paymentInit);
    //
    //     // Act & Assert
    //     mockMvc.perform(post("/api/v1/donations/guardianship")
    //             .contentType(MediaType.APPLICATION_JSON)
    //             .content(objectMapper.writeValueAsString(request)))
    //         .andExpect(status().isCreated())
    //         .andExpect(jsonPath("$.paymentUrl").value("https://stripe.com/pay/123"));
    // }

    @Test
    @WithMockUser(username = "test@example.com", roles = "USER")
    void createGuardianship_InvalidAmount_Returns400() throws Exception {
        // Arrange
        GuardianshipRequest request = new GuardianshipRequest(1L, new BigDecimal("-10.00"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/donations/guardianship")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = "USER")
    void createGuardianship_MissingAnimalId_Returns400() throws Exception {
        // Arrange
        GuardianshipRequest request = new GuardianshipRequest(null, new BigDecimal("50.00"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/donations/guardianship")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void cancelGuardianship_Success_Returns204() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/v1/donations/guardianship/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void cancelGuardianship_NotFound_Returns404() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/v1/donations/guardianship/999"))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void getMyGuardianships_Success_Returns200() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/donations/my-guardianships"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"));
    }

    @Test
    void processWebhook_Success_Returns200() throws Exception {
        // Arrange
        String payload = "{\"type\":\"checkout.session.completed\"}";
        String sigHeader = "test_sig";

        // Act & Assert
        mockMvc.perform(post("/api/v1/donations/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("Stripe-Signature", sigHeader))
            .andExpect(status().isOk());
    }

    @Test
    void processWebhook_MissingSignatureHeader_Returns400() throws Exception {
        // Arrange
        String payload = "{\"type\":\"checkout.session.completed\"}";

        // Act & Assert
        mockMvc.perform(post("/api/v1/donations/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isBadRequest());
    }

    @Test
    void processWebhook_InvalidSignature_Returns401() throws Exception {
        // Arrange
        String payload = "invalid_payload";
        String sigHeader = "invalid_sig";

        // Act & Assert
        mockMvc.perform(post("/api/v1/donations/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("Stripe-Signature", sigHeader))
            .andExpect(status().isUnauthorized());
    }
}