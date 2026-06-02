package ua.edu.ukma.swipet.backend.chat.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.chat.entity.ChatRoom;

import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByUser_IdAndShelter_IdAndAnimal_Id(Long userId, Long shelterId, Long animalId);

    @Query("SELECT r FROM ChatRoom r WHERE r.user.id = :userId ORDER BY r.lastMessageAt DESC NULLS LAST")
    Page<ChatRoom> findByUserIdWithPagination(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT r FROM ChatRoom r WHERE r.shelter.id = :shelterId ORDER BY r.lastMessageAt DESC NULLS LAST")
    Page<ChatRoom> findByShelterIdWithPagination(@Param("shelterId") Long shelterId, Pageable pageable);
}