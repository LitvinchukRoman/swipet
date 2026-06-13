package ua.edu.ukma.swipet.backend.booking.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import ua.edu.ukma.swipet.backend.AbstractIntegrationTest;
import ua.edu.ukma.swipet.backend.auth.security.WithMockAuthenticatedUser;
import ua.edu.ukma.swipet.backend.booking.dto.BookingSlotRequest;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Sql("/data.sql")
class AccessControlTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void createSlot_RegularUser_Returns403() throws Exception {
        // Arrange
        BookingSlotRequest request = new BookingSlotRequest(
            LocalDateTime.now().plusDays(1),
            LocalDateTime.now().plusDays(1).plusHours(2),
            5
        );

        // Act & Assert
        mockMvc.perform(post("/api/v1/shelters/1/slots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockAuthenticatedUser(userId = 2L, email = "admin@example.com", role = "ADMIN")
    void createSlot_AdminUser_Returns201() throws Exception {
        // Arrange — час не перетинається із засіяним у data.sql слотом (+1 день)
        BookingSlotRequest request = new BookingSlotRequest(
            LocalDateTime.now().plusDays(7),
            LocalDateTime.now().plusDays(7).plusHours(2),
            5
        );

        // Act & Assert
        mockMvc.perform(post("/api/v1/shelters/1/slots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockAuthenticatedUser(userId = 3L, email = "shelter@example.com", role = "SHELTER_ADMIN")
    void createSlot_ShelterAdminUser_Returns201() throws Exception {
        // Arrange — притулок 1 належить shelter-адміну (user id 3, див. data.sql);
        // час не перетинається із засіяним у data.sql слотом (+8 днів)
        BookingSlotRequest request = new BookingSlotRequest(
            LocalDateTime.now().plusDays(8),
            LocalDateTime.now().plusDays(8).plusHours(2),
            5
        );

        // Act & Assert
        mockMvc.perform(post("/api/v1/shelters/1/slots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockAuthenticatedUser(userId = 3L, email = "shelter@example.com", role = "SHELTER_ADMIN")
    void createSlot_ShelterAdminForeignShelter_Returns403() throws Exception {
        // Притулок 2 належить іншому власнику (user 2) — shelter-адмін притулку 1 не має доступу.
        BookingSlotRequest request = new BookingSlotRequest(
            LocalDateTime.now().plusDays(9),
            LocalDateTime.now().plusDays(9).plusHours(2),
            5
        );

        mockMvc.perform(post("/api/v1/shelters/2/slots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void bookSlot_RegularUser_Returns201() throws Exception {
        // Arrange
        // Note: This endpoint should be accessible to regular users

        // Act & Assert
        mockMvc.perform(post("/api/v1/slots/1/reservations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"notes\":\"Test booking\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    void createSlot_UnauthenticatedUser_Returns401() throws Exception {
        // Arrange
        BookingSlotRequest request = new BookingSlotRequest(
            LocalDateTime.now().plusDays(1),
            LocalDateTime.now().plusDays(1).plusHours(2),
            5
        );

        // Act & Assert
        mockMvc.perform(post("/api/v1/shelters/1/slots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void bookSlot_UnauthenticatedUser_Returns401() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/slots/1/reservations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"notes\":\"Test booking\"}"))
            .andExpect(status().isUnauthorized());
    }
}