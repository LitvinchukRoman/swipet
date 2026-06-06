package ua.edu.ukma.swipet.backend.analytics.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ua.edu.ukma.swipet.backend.analytics.dto.AnimalAnalyticsResponse;
import ua.edu.ukma.swipet.backend.analytics.service.AnalyticsService;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.auth.security.CurrentUser;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shelters")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/me/analytics")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public List<AnimalAnalyticsResponse> getMyAnalytics(
            @CurrentUser AuthenticatedUser currentUser,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        
        return analyticsService.getAnalyticsForAdmin(currentUser.id(), dateFrom, dateTo);
    }
}