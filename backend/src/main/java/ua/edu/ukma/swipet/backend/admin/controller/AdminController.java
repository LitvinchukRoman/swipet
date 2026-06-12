package ua.edu.ukma.swipet.backend.admin.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ua.edu.ukma.swipet.backend.admin.dto.AdminStatsResponse;
import ua.edu.ukma.swipet.backend.admin.dto.CreateShelterRequest;
import ua.edu.ukma.swipet.backend.admin.dto.UpdateRoleRequest;
import ua.edu.ukma.swipet.backend.admin.dto.VerifyShelterRequest;
import ua.edu.ukma.swipet.backend.admin.service.AdminService;
import ua.edu.ukma.swipet.backend.auth.dto.UserResponse;
import ua.edu.ukma.swipet.backend.shelter.dto.ShelterResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return adminService.getStats();
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return adminService.listUsers();
    }

    @PatchMapping("/users/{id}/role")
    public UserResponse updateUserRole(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest request) {
        return adminService.updateUserRole(id, request.role());
    }

    @GetMapping("/shelters")
    public List<ShelterResponse> shelters() {
        return adminService.listShelters();
    }

    @PostMapping("/shelters")
    @ResponseStatus(HttpStatus.CREATED)
    public ShelterResponse createShelter(@Valid @RequestBody CreateShelterRequest request) {
        return adminService.createShelterForUser(request);
    }

    @PatchMapping("/shelters/{id}/verify")
    public ShelterResponse verifyShelter(@PathVariable Long id, @Valid @RequestBody VerifyShelterRequest request) {
        return adminService.setVerified(id, request.verified());
    }
}
