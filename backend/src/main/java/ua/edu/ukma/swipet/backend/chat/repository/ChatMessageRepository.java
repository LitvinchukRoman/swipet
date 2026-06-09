package ua.edu.ukma.swipet.backend.chat.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.chat.entity.ChatMessage;

import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    Page<ChatMessage> findByRoom_IdOrderBySentAtDesc(Long roomId, Pageable pageable);

    /** Останнє повідомлення кімнати (для прев'ю у списку чатів). */
    Optional<ChatMessage> findFirstByRoom_IdOrderBySentAtDesc(Long roomId);

    /** Кількість непрочитаних повідомлень у кімнаті, надісланих НЕ цим користувачем. */
    long countByRoom_IdAndIsReadFalseAndSender_IdNot(Long roomId, Long senderId);

}