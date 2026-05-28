package ua.edu.ukma.swipet.backend.animal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.animal.dto.AnimalRequest;
import ua.edu.ukma.swipet.backend.animal.dto.AnimalResponse;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.entity.AnimalStatus;
import ua.edu.ukma.swipet.backend.animal.mapper.AnimalMapper;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;
import ua.edu.ukma.swipet.backend.shelter.repository.ShelterRepository;

@Service
@RequiredArgsConstructor
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final ShelterRepository shelterRepository;
    private final AnimalMapper animalMapper;

    @Transactional
    public AnimalResponse createAnimal(AnimalRequest request) {
        // Перевіряємо, чи існує такий притулок
        Shelter shelter = shelterRepository.findById(request.shelterId())
                .orElseThrow(() -> new RuntimeException("Притулок з ID " + request.shelterId() + " не знайдено"));

        Animal animal = animalMapper.toEntity(request, shelter);
        Animal savedAnimal = animalRepository.save(animal);
        
        return animalMapper.toResponse(savedAnimal);
    }

    @Transactional(readOnly = true)
    public AnimalResponse getAnimalById(Long id) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Тварину з ID " + id + " не знайдено"));
        
        return animalMapper.toResponse(animal);
    }

    @Transactional
    public AnimalResponse updateAnimal(Long id, AnimalRequest request) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Тварину з ID " + id + " не знайдено"));

        animal.setName(request.name());
        animal.setSpecies(request.species());
        animal.setBreed(request.breed());
        animal.setAgeMonths(request.ageMonths());
        animal.setSize(request.size());
        animal.setGender(request.gender());
        animal.setDescription(request.description());
        animal.setIsVaccinated(request.isVaccinated());
        animal.setIsSterilized(request.isSterilized());

        // Збереження викликати не обов'язково через брудну перевірку (Dirty Checking), але можна залишити для наочності
        return animalMapper.toResponse(animal);
    }

    @Transactional
    public void deleteAnimal(Long id) {
        if (!animalRepository.existsById(id)) {
            throw new RuntimeException("Тварину з ID " + id + " не знайдено");
        }
        animalRepository.deleteById(id);
    }
    
    @Transactional
    public void updateAnimalStatus(Long id, AnimalStatus newStatus) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Тварину з ID " + id + " не знайдено"));
        animal.setStatus(newStatus);
    }
}