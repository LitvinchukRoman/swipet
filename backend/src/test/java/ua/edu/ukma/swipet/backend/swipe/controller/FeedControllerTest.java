package ua.edu.ukma.swipet.backend.swipe.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import ua.edu.ukma.swipet.backend.AbstractIntegrationTest;
import ua.edu.ukma.swipet.backend.auth.security.WithMockAuthenticatedUser;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Sql("/data.sql")
class FeedControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void getFeed_WithValidLocation_ReturnsAnimalsInRadius() throws Exception {
        // Arrange - Kyiv coordinates
        Double lat = 50.4501;
        Double lng = 30.5234;
        Double radiusKm = 10.0;

        // Act & Assert
        mockMvc.perform(get("/api/v1/feed")
                .param("lat", lat.toString())
                .param("lng", lng.toString())
                .param("radiusKm", radiusKm.toString()))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"));
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void getFeed_WithSpeciesFilter_ReturnsFilteredAnimals() throws Exception {
        // Arrange
        Double lat = 50.4501;
        Double lng = 30.5234;
        String species = "DOG";

        // Act & Assert
        mockMvc.perform(get("/api/v1/feed")
                .param("lat", lat.toString())
                .param("lng", lng.toString())
                .param("species", species))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"));
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void getFeed_WithSizeFilter_ReturnsFilteredAnimals() throws Exception {
        // Arrange
        Double lat = 50.4501;
        Double lng = 30.5234;
        String size = "MEDIUM";

        // Act & Assert
        mockMvc.perform(get("/api/v1/feed")
                .param("lat", lat.toString())
                .param("lng", lng.toString())
                .param("size", size))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"));
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void getFeed_WithAgeMaxFilter_ReturnsFilteredAnimals() throws Exception {
        // Arrange
        Double lat = 50.4501;
        Double lng = 30.5234;
        Integer ageMax = 36; // 3 years in months

        // Act & Assert
        mockMvc.perform(get("/api/v1/feed")
                .param("lat", lat.toString())
                .param("lng", lng.toString())
                .param("ageMax", ageMax.toString()))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"));
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void getFeed_WithLimit_ReturnsLimitedAnimals() throws Exception {
        // Arrange
        Double lat = 50.4501;
        Double lng = 30.5234;
        Integer limit = 5;

        // Act & Assert
        mockMvc.perform(get("/api/v1/feed")
                .param("lat", lat.toString())
                .param("lng", lng.toString())
                .param("limit", limit.toString()))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"));
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void getFeed_MissingLatParam_ReturnsBadRequest() throws Exception {
        // Arrange
        Double lng = 30.5234;

        // Act & Assert
        mockMvc.perform(get("/api/v1/feed")
                .param("lng", lng.toString()))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void getFeed_MissingLngParam_ReturnsBadRequest() throws Exception {
        // Arrange
        Double lat = 50.4501;

        // Act & Assert
        mockMvc.perform(get("/api/v1/feed")
                .param("lat", lat.toString()))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void getLikedAnimals_WithPagination_ReturnsLikedAnimals() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/feed/liked")
                .param("page", "1")
                .param("limit", "10"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"));
    }

    @Test
    @WithMockAuthenticatedUser(userId = 1L, role = "USER")
    void getLikedAnimals_WithoutPagination_ReturnsDefaultPage() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/feed/liked"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/json"));
    }
}