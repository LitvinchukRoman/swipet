package ua.edu.ukma.swipet.backend.animal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.animal.entity.AnimalPhoto;

@Repository
public interface AnimalPhotoRepository extends JpaRepository<AnimalPhoto, Long> {
}