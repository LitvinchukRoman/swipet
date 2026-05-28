package ua.edu.ukma.swipet.backend.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ua.edu.ukma.swipet.backend.auth.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
}
