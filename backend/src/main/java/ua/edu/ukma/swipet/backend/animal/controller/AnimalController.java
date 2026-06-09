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

@RestController
@RequestMapping("/api/v1/animals")
@RequiredArgsConstructor
public class AnimalController {

    private final AnimalService animalService;
    private final PhotoService photoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public AnimalResponse createAnimal(@Valid @RequestBody AnimalRequest request) {
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
            @PathVariable Long id, 
            @Valid @RequestBody AnimalRequest request) {
        return animalService.updateAnimal(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public void deleteAnimal(@PathVariable Long id) {
        animalService.deleteAnimal(id);
    }

    // --- Робота з фотографіями ---

    @PostMapping("/{id}/photos")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public PhotoResponse uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder) {
        return photoService.uploadPhoto(id, file, sortOrder);
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SHELTER_ADMIN', 'ADMIN')")
    public void deletePhoto(@PathVariable Long id, @PathVariable Long photoId) {
        photoService.deletePhoto(id, photoId);
    }
}