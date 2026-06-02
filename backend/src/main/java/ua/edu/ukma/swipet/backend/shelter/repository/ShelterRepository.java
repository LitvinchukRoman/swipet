package ua.edu.ukma.swipet.backend.shelter.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;

import java.util.Optional;

@Repository
public interface ShelterRepository extends JpaRepository<Shelter, Long> {

    Optional<Shelter> findByAdminUser_Id(Long adminUserId);

}