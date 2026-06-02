package ua.edu.ukma.swipet.backend.chat.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.chat.dto.ChatMessageResponse;
import ua.edu.ukma.swipet.backend.chat.dto.ChatRoomResponse;
import ua.edu.ukma.swipet.backend.chat.dto.MessageSaveRequest;
import ua.edu.ukma.swipet.backend.chat.entity.ChatMessage;
import ua.edu.ukma.swipet.backend.chat.entity.ChatRoom;
import ua.edu.ukma.swipet.backend.chat.mapper.ChatMapper;
import ua.edu.ukma.swipet.backend.chat.repository.ChatMessageRepository;
import ua.edu.ukma.swipet.backend.chat.repository.ChatRoomRepository;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;
import ua.edu.ukma.swipet.backend.shelter.repository.ShelterRepository;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ShelterRepository shelterRepository;
    private final AnimalRepository animalRepository;
    private final ChatMapper chatMapper;

    @Transactional
    public ChatRoomResponse getOrCreateRoom(Long userId, Long shelterId, Long animalId) {
        Optional<ChatRoom> existingRoom = chatRoomRepository.findByUser_IdAndShelter_IdAndAnimal_Id(userId, shelterId, animalId);
        
        if (existingRoom.isPresent()) {
            return chatMapper.toRoomResponse(existingRoom.get());
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));
        Shelter shelter = shelterRepository.findById(shelterId)
                .orElseThrow(() -> new RuntimeException("Притулок не знайдено"));
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new RuntimeException("Тварину не знайдено"));

        ChatRoom newRoom = ChatRoom.builder()
                .user(user)
                .shelter(shelter)
                .animal(animal)
                .build();

        ChatRoom savedRoom = chatRoomRepository.save(newRoom);
        return chatMapper.toRoomResponse(savedRoom);
    }

    @Transactional
    public ChatMessageResponse saveMessage(Long roomId, MessageSaveRequest request) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Кімнату чату не знайдено"));

        User sender = userRepository.findById(request.senderId())
                .orElseThrow(() -> new RuntimeException("Відправника не знайдено"));

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(request.content())
                .build();
        
        ChatMessage savedMessage = chatMessageRepository.save(message);

        room.setLastMessageAt(savedMessage.getSentAt());

        return chatMapper.toMessageResponse(savedMessage);
    }

    @Transactional(readOnly = true)
    public Page<ChatRoomResponse> getUserRooms(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page > 0 ? page - 1 : 0, size);
        return chatRoomRepository.findByUserIdWithPagination(userId, pageable)
                .map(chatMapper::toRoomResponse);
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getRoomHistory(Long roomId, int page, int size) {
        Pageable pageable = PageRequest.of(page > 0 ? page - 1 : 0, size);
        return chatMessageRepository.findByRoom_IdOrderBySentAtDesc(roomId, pageable)
                .map(chatMapper::toMessageResponse);
    }
}