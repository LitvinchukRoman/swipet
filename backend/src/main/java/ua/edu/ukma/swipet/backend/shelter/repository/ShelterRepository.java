package ua.edu.ukma.swipet.backend.shelter.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {}