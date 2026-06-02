package ua.edu.ukma.swipet.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MessageSaveRequest(
        @NotNull(message = "ID відправника є обов'язковим")
        Long senderId,
        
        @NotBlank(message = "Текст повідомлення не може бути порожнім")
        String content
) {}