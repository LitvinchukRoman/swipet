package ua.edu.ukma.swipet.backend.chat.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.auth.security.CurrentUser;
import ua.edu.ukma.swipet.backend.chat.dto.ChatMessageResponse;
import ua.edu.ukma.swipet.backend.chat.dto.ChatRoomResponse;
import ua.edu.ukma.swipet.backend.chat.dto.MessageSaveRequest;
import ua.edu.ukma.swipet.backend.chat.service.ChatService;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatRoomResponse getOrCreateRoom(
            @CurrentUser AuthenticatedUser currentUser,
            @RequestParam Long shelterId,
            @RequestParam Long animalId) {
        return chatService.getOrCreateRoom(currentUser.id(), shelterId, animalId);
    }

    @GetMapping("/rooms")
    @ResponseStatus(HttpStatus.OK)
    public Page<ChatRoomResponse> getUserRooms(
            @CurrentUser AuthenticatedUser currentUser,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return chatService.getUserRooms(currentUser.id(), currentUser.role(), page, size);
    }

    @GetMapping("/rooms/{roomId}/messages")
    @ResponseStatus(HttpStatus.OK)
    public Page<ChatMessageResponse> getRoomHistory(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return chatService.getRoomHistory(roomId, page, size);
    }

    @PostMapping("/internal/rooms/{roomId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse saveMessageFromNodeJs(
            @PathVariable Long roomId,
            @Valid @RequestBody MessageSaveRequest request) {
        return chatService.saveMessage(roomId, request);
    }
}