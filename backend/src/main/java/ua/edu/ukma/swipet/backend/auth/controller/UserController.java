package ua.edu.ukma.swipet.backend.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ua.edu.ukma.swipet.backend.auth.dto.UpdateLocationRequest;
import ua.edu.ukma.swipet.backend.auth.dto.UpdateProfileRequest;
import ua.edu.ukma.swipet.backend.auth.dto.UserResponse;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.auth.security.CurrentUser;
import ua.edu.ukma.swipet.backend.auth.service.UserService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Профіль користувача")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Оновити свій профіль", security = @SecurityRequirement(name = "bearer-jwt"))
    @PatchMapping("/me")
    @ResponseStatus(HttpStatus.OK)
    public UserResponse updateMe(
            @CurrentUser AuthenticatedUser currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(currentUser.id(), request);
    }

    @Operation(summary = "Оновити геолокацію", security = @SecurityRequirement(name = "bearer-jwt"))
    @PatchMapping("/me/location")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, String> updateLocation(
            @CurrentUser AuthenticatedUser currentUser,
            @Valid @RequestBody UpdateLocationRequest request) {
        userService.updateLocation(currentUser.id(), request.lat(), request.lng());
        return Map.of("message", "location updated");
    }

    @Operation(summary = "Завантажити аватар", security = @SecurityRequirement(name = "bearer-jwt"))
    @PostMapping("/me/avatar")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, String> uploadAvatar(
            @CurrentUser AuthenticatedUser currentUser,
            @RequestParam("file") MultipartFile file) {
        String avatarUrl = userService.uploadAvatar(currentUser.id(), file);
        return Map.of("avatarUrl", avatarUrl);
    }
}
