package ua.edu.ukma.swipet.backend.swipe.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.auth.security.CurrentUser;
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
            @CurrentUser AuthenticatedUser currentUser,
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String species,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) Integer ageMax,
            @RequestParam(required = false) List<Long> excludeIds,
            @RequestParam(required = false) Integer limit) {

        // Перегляди більше НЕ рахуються тут (це накручувало лічильник на кожен
        // fetch/prefetch). «Перегляд» інкрементиться у момент свайпу — SwipeService.
        return feedService.getFeed(currentUser.id(), lat, lng, radiusKm, species, size, ageMax, excludeIds, limit);
    }

    @PostMapping("/swipe")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> recordSwipe(
            @CurrentUser AuthenticatedUser currentUser,
            @Valid @RequestBody SwipeRequest request) {
        
        return swipeService.recordSwipe(currentUser.id(), request);
    }

    @GetMapping("/liked")
    @ResponseStatus(HttpStatus.OK)
    public List<ua.edu.ukma.swipet.backend.animal.dto.AnimalResponse> getLikedAnimals(
        @CurrentUser AuthenticatedUser currentUser,
        @RequestParam(required = false, defaultValue = "1") Integer page,
        @RequestParam(required = false, defaultValue = "20") Integer limit) {

        return feedService.getLikedAnimals(currentUser.id(), page, limit);
    }
}