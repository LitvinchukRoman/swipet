package ua.edu.ukma.swipet.backend.animal.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ua.edu.ukma.swipet.backend.animal.dto.AnimalRequest;
import ua.edu.ukma.swipet.backend.animal.dto.AnimalResponse;
import ua.edu.ukma.swipet.backend.animal.dto.PhotoResponse;
import ua.edu.ukma.swipet.backend.animal.service.AnimalService;
import ua.edu.ukma.swipet.backend.animal.service.PhotoService;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.auth.security.CurrentUser;
import ua.edu.ukma.swipet.backend.common.security.ShelterOwnershipGuard;

@RestController
@RequestMapping("/api/v1/animals")
@RequiredArgsConstructor
public class AnimalController {

    private final AnimalService animalService;
    private final PhotoService photoService;
    private final ShelterOwnershipGuard ownershipGuard;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public AnimalResponse createAnimal(
            @CurrentUser AuthenticatedUser currentUser,
            @Valid @RequestBody AnimalRequest request) {
        ownershipGuard.assertCanManageShelter(currentUser, request.shelterId());
        return animalService.createAnimal(request);
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public AnimalResponse getAnimal(@PathVariable Long id) {
        return animalService.getAnimalById(id);
    }

    /** Список тварин притулку: GET /api/v1/animals?shelterId={id} (дашборд адміна / профіль притулку). */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public java.util.List<AnimalResponse> getAnimalsByShelter(@RequestParam Long shelterId) {
        return animalService.getAnimalsByShelter(shelterId);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public AnimalResponse updateAnimal(
            @CurrentUser AuthenticatedUser currentUser,
            @PathVariable Long id, 
            @Valid @RequestBody AnimalRequest request) {
        ownershipGuard.assertCanManageAnimal(currentUser, id);
        return animalService.updateAnimal(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public void deleteAnimal(
            @CurrentUser AuthenticatedUser currentUser,
            @PathVariable Long id) {
        ownershipGuard.assertCanManageAnimal(currentUser, id);
        animalService.deleteAnimal(id);
    }

    // --- Робота з фотографіями ---

    @PostMapping("/{id}/photos")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public PhotoResponse uploadPhoto(
            @CurrentUser AuthenticatedUser currentUser,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder) {
        ownershipGuard.assertCanManageAnimal(currentUser, id);
        return photoService.uploadPhoto(id, file, sortOrder);
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public void deletePhoto(
            @CurrentUser AuthenticatedUser currentUser,
            @PathVariable Long id,
            @PathVariable Long photoId) {
        ownershipGuard.assertCanManageAnimal(currentUser, id);
        photoService.deletePhoto(id, photoId);
    }

    @PutMapping("/{id}/photos/{photoId}/primary")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public void setPrimaryPhoto(
            @CurrentUser AuthenticatedUser currentUser,
            @PathVariable Long id,
            @PathVariable Long photoId) {
        ownershipGuard.assertCanManageAnimal(currentUser, id);
        photoService.setPrimaryPhoto(id, photoId);
    }
}