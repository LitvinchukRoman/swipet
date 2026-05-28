package ua.edu.ukma.swipet.backend.swipe.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ua.edu.ukma.swipet.backend.swipe.dto.FeedAnimalResponse;
import ua.edu.ukma.swipet.backend.swipe.dto.SwipeRequest;
import ua.edu.ukma.swipet.backend.swipe.service.FeedService;
import ua.edu.ukma.swipet.backend.swipe.service.SwipeService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;
    private final SwipeService swipeService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<FeedAnimalResponse> getFeed(
            @RequestHeader("X-User-Id") Long userId, // Тимчасове рішення для тестування
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String species,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) Integer ageMax,
            @RequestParam(required = false) Integer limit) {
        
        return feedService.getFeed(userId, lat, lng, radiusKm, species, size, ageMax, limit);
    }

    @PostMapping("/swipe")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> recordSwipe(
            @RequestHeader("X-User-Id") Long userId, // Тимчасове рішення для тестування
            @Valid @RequestBody SwipeRequest request) {
        
        return swipeService.recordSwipe(userId, request);
    }
}