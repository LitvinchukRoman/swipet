package ua.edu.ukma.swipet.backend.chat.dto;

import java.time.LocalDateTime;

public record ChatRoomResponse(
        Long id,
        Long shelterId,
        String shelterName,
        Long animalId,
        String animalName,
        String animalSpecies,
        String animalPrimaryPhotoUrl,
        LocalDateTime lastMessageAt,
        String lastMessage,
        Long unreadCount
) {}