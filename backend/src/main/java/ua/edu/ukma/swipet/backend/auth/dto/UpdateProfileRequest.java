package ua.edu.ukma.swipet.backend.auth.dto;

import jakarta.validation.constraints.Size;

/** PATCH /api/v1/users/me — часткове оновлення профілю (null = поле не змінювати). */
public record UpdateProfileRequest(
        @Size(max = 100, message = "Ім'я не повинно перевищувати 100 символів")
        String fullName,

        @Size(max = 20, message = "Телефон не повинен перевищувати 20 символів")
        String phone
) {}
