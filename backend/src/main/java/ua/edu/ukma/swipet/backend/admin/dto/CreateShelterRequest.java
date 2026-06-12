package ua.edu.ukma.swipet.backend.admin.dto;

import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.URL;

/**
 * Адмін створює притулок і призначає його адміністратором наявного користувача
 * (за email). Користувачу проставляється роль SHELTER_ADMIN. Деталі профілю
 * (опис, лого, точні контакти) надалі заповнює сам shelter-адмін.
 */
public record CreateShelterRequest(
        @NotBlank(message = "Email адміна притулку є обов'язковим")
        @Email(message = "Невірний формат email")
        String adminEmail,

        @NotBlank(message = "Назва притулку є обов'язковою")
        @Size(max = 200, message = "Назва не повинна перевищувати 200 символів")
        String name,

        String description,

        @NotBlank(message = "Адреса є обов'язковою")
        String address,

        @NotBlank(message = "Місто є обов'язковим")
        @Size(max = 100, message = "Назва міста не повинна перевищувати 100 символів")
        String city,

        @NotNull(message = "Широта є обов'язковою")
        @DecimalMin(value = "-90.0", message = "Широта повинна бути більше -90")
        @DecimalMax(value = "90.0", message = "Широта повинна бути менше 90")
        Double locationLat,

        @NotNull(message = "Довгота є обов'язковою")
        @DecimalMin(value = "-180.0", message = "Довгота повинна бути більше -180")
        @DecimalMax(value = "180.0", message = "Довгота повинна бути менше 180")
        Double locationLng,

        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Невірний формат номеру телефону")
        String phone,

        @URL(message = "Невірний формат URL веб-сайту")
        String websiteUrl
) {}
