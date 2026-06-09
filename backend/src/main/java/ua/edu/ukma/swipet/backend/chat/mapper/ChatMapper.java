package ua.edu.ukma.swipet.backend.chat.mapper;

import org.springframework.stereotype.Component;
import ua.edu.ukma.swipet.backend.chat.dto.ChatMessageResponse;
import ua.edu.ukma.swipet.backend.chat.dto.ChatRoomResponse;
import ua.edu.ukma.swipet.backend.chat.entity.ChatMessage;
import ua.edu.ukma.swipet.backend.chat.entity.ChatRoom;

@Component
public class ChatMapper {

    public ChatRoomResponse toRoomResponse(ChatRoom room) {
        return toRoomResponse(room, null, 0L);
    }

    public ChatRoomResponse toRoomResponse(ChatRoom room, String lastMessage, Long unreadCount) {
        return new ChatRoomResponse(
                room.getId(),
                room.getShelter().getId(),
                room.getShelter().getName(),
                room.getAnimal().getId(),
                room.getAnimal().getName(),
                room.getAnimal().getPrimaryPhotoUrl(),
                room.getLastMessageAt(),
                lastMessage,
                unreadCount
        );
    }

    public ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRoom().getId(),
                message.getSender().getId(),
                message.getContent(),
                message.getSentAt(),
                message.getIsRead()
        );
    }
}