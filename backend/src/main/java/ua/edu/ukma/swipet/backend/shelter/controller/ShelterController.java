package ua.edu.ukma.swipet.backend.shelter.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.auth.security.CurrentUser;
import ua.edu.ukma.swipet.backend.shelter.dto.ShelterRequest;
import ua.edu.ukma.swipet.backend.shelter.dto.ShelterResponse;
import ua.edu.ukma.swipet.backend.shelter.service.ShelterService;

@RestController
@RequestMapping("/api/v1/shelters")
@RequiredArgsConstructor
public class ShelterController {

    private final ShelterService shelterService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public ShelterResponse createShelter(
            @CurrentUser AuthenticatedUser currentUser,
            @Valid @RequestBody ShelterRequest request) {
        return shelterService.createShelter(currentUser.id(), request);
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ShelterResponse getShelter(@PathVariable Long id) {
        return shelterService.getShelterById(id);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public ShelterResponse updateShelter(
            @PathVariable Long id,
            @Valid @RequestBody ShelterRequest request) {
        return shelterService.updateShelter(id, request);
    }

    @PostMapping("/{id}/logo")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public ShelterResponse uploadLogo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return shelterService.uploadLogo(id, file);
    }
}