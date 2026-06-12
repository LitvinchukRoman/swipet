package ua.edu.ukma.swipet.backend.admin.dto;

import jakarta.validation.constraints.NotNull;
import ua.edu.ukma.swipet.backend.auth.entity.Role;

public record UpdateRoleRequest(
        @NotNull(message = "Роль є обов'язковою")
        Role role
) {}
