package ua.edu.ukma.swipet.backend.animal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ua.edu.ukma.swipet.backend.animal.dto.PhotoResponse;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.entity.AnimalPhoto;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalPhotoRepository;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.common.storage.StorageService;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final AnimalRepository animalRepository;
    private final AnimalPhotoRepository animalPhotoRepository;
    private final StorageService storageService;

    @Transactional
    public PhotoResponse uploadPhoto(Long animalId, MultipartFile file, Integer sortOrder) {
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new RuntimeException("Тварину не знайдено"));

        // Делегуємо фізичне збереження файлу інтерфейсу
        String url = storageService.uploadFile(file);

        AnimalPhoto photo = AnimalPhoto.builder()
                .url(url)
                .sortOrder(sortOrder != null ? sortOrder : 0)
                .build();

        // Синхронізуємо двонаправлений зв'язок
        animal.addPhoto(photo);
        
        // Зберігаємо в базу даних
        AnimalPhoto savedPhoto = animalPhotoRepository.save(photo);

        return new PhotoResponse(savedPhoto.getId(), savedPhoto.getUrl(), savedPhoto.getSortOrder());
    }

    @Transactional
    public void deletePhoto(Long animalId, Long photoId) {
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new RuntimeException("Тварину не знайдено"));

        AnimalPhoto photo = animalPhotoRepository.findById(photoId)
                .orElseThrow(() -> new RuntimeException("Фото не знайдено"));

        // Перевірка безпеки: чи дійсно це фото належить цій тварині
        if (!photo.getAnimal().getId().equals(animalId)) {
            throw new RuntimeException("Це фото не належить вказаній тварині");
        }

        // Видаляємо фізичний файл з S3/MinIO
        storageService.deleteFile(photo.getUrl());

        // Завдяки orphanRemoval = true в Animal, видалення з колекції автоматично зітре запис з бази
        animal.removePhoto(photo);
    }
}