package ua.edu.ukma.swipet.backend.shelter.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.common.storage.StorageService;
import ua.edu.ukma.swipet.backend.shelter.dto.ShelterRequest;
import ua.edu.ukma.swipet.backend.shelter.dto.ShelterResponse;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;
import ua.edu.ukma.swipet.backend.shelter.mapper.ShelterMapper;
import ua.edu.ukma.swipet.backend.shelter.repository.ShelterRepository;

@Service
@RequiredArgsConstructor
public class ShelterService {

    private final ShelterRepository shelterRepository;
    private final UserRepository userRepository;
    private final ShelterMapper shelterMapper;
    private final StorageService storageService;

    @Transactional
    public ShelterResponse createShelter(Long adminUserId, ShelterRequest request) {
        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> AppException.notFound("Користувача не знайдено"));

        Shelter shelter = shelterMapper.toEntity(request, adminUser);
        Shelter savedShelter = shelterRepository.save(shelter);
        
        return shelterMapper.toResponse(savedShelter);
    }

    @Transactional(readOnly = true)
    public ShelterResponse getShelterById(Long id) {
        Shelter shelter = shelterRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Притулок з ID " + id));
        
        return shelterMapper.toResponse(shelter);
    }

    @Transactional
    public ShelterResponse updateShelter(Long id, ShelterRequest request) {
        Shelter shelter = shelterRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Притулок з ID " + id));

        shelter.setName(request.name());
        shelter.setDescription(request.description());
        shelter.setAddress(request.address());
        shelter.setCity(request.city());
        shelter.setLocationLat(request.locationLat());
        shelter.setLocationLng(request.locationLng());
        shelter.setPhone(request.phone());
        shelter.setWebsiteUrl(request.websiteUrl());

        return shelterMapper.toResponse(shelter);
    }

    @Transactional
    public ShelterResponse uploadLogo(Long id, MultipartFile file) {
        Shelter shelter = shelterRepository.findById(id)
            .orElseThrow(() -> AppException.notFound("Притулок з ID " + id));

        if (shelter.getLogoUrl() != null && !shelter.getLogoUrl().isBlank()) {
            storageService.deleteFile(shelter.getLogoUrl());
        }

        String newLogoUrl = storageService.uploadFile(file);
        shelter.setLogoUrl(newLogoUrl);

        return shelterMapper.toResponse(shelter);
    }
}