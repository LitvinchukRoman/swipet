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
import ua.edu.ukma.swipet.backend.common.exception.AppException;
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
                .orElseThrow(() -> AppException.notFound("Притулок з ID " + request.shelterId()));

        Animal animal = animalMapper.toEntity(request, shelter);
        Animal savedAnimal = animalRepository.save(animal);
        
        return animalMapper.toResponse(savedAnimal);
    }

    @Transactional(readOnly = true)
    public AnimalResponse getAnimalById(Long id) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Тварину з ID " + id));

        return animalMapper.toResponse(animal);
    }

    /** Список тварин притулку — для дашборду адміна. */
    @Transactional(readOnly = true)
    public java.util.List<AnimalResponse> getAnimalsByShelter(Long shelterId) {
        return animalRepository.findByShelter_IdOrderByCreatedAtDesc(shelterId).stream()
                .map(animalMapper::toResponse)
                .toList();
    }

    @Transactional
    public AnimalResponse updateAnimal(Long id, AnimalRequest request) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Тварину з ID " + id));

        animal.setName(request.name());
        animal.setSpecies(request.species());
        animal.setBreed(request.breed());
        animal.setAgeMonths(request.ageMonths());
        animal.setSize(request.size());
        animal.setGender(request.gender());
        animal.setDescription(request.description());
        animal.setIsVaccinated(request.isVaccinated());
        animal.setIsSterilized(request.isSterilized());

        if (request.status() != null) {
            animal.setStatus(request.status());
        }

        // Збереження викликати не обов'язково через брудну перевірку (Dirty Checking), але можна залишити для наочності
        return animalMapper.toResponse(animal);
    }

    @Transactional
    public void deleteAnimal(Long id) {
        if (!animalRepository.existsById(id)) {
            throw AppException.notFound("Тварину з ID " + id);
        }
        animalRepository.deleteById(id);
    }
}