package ua.edu.ukma.swipet.backend.animal.dto;

import jakarta.validation.constraints.*;
import ua.edu.ukma.swipet.backend.animal.entity.Gender;
import ua.edu.ukma.swipet.backend.animal.entity.Size;
import ua.edu.ukma.swipet.backend.animal.entity.Species;

public record AnimalRequest(
        @NotNull(message = "ID притулку є обов'язковим")
        Long shelterId,

        @NotBlank(message = "Кличка тварини не може бути порожньою")
        @jakarta.validation.constraints.Size(max = 100, message = "Кличка не повинна перевищувати 100 символів")
        String name,

        @NotNull(message = "Вид тварини є обов'язковим")
        Species species,

        @jakarta.validation.constraints.Size
        String breed,

        @NotNull(message = "Вік є обов'язковим")
        @PositiveOrZero(message = "Вік не може бути від'ємним")
        Integer ageMonths,

        @NotNull(message = "Розмір є обов'язковим")
        Size size,

        @NotNull(message = "Стать є обов'язковою")
        Gender gender,

        String description,

        @NotNull(message = "Статус вакцинації має бути вказаний")
        Boolean isVaccinated,

        @NotNull(message = "Статус стерилізації має бути вказаний")
        Boolean isSterilized
) {}