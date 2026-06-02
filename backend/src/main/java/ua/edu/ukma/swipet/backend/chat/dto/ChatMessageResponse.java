package ua.edu.ukma.swipet.backend.chat.dto;

import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long id,
        Long roomId,
        Long senderId,
        String content,
        LocalDateTime sentAt,
        Boolean isRead
) {}