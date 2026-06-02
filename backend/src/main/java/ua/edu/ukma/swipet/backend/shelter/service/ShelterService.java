package ua.edu.ukma.swipet.backend.shelter.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
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

    @Transactional
    public ShelterResponse createShelter(Long adminUserId, ShelterRequest request) {
        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

        Shelter shelter = shelterMapper.toEntity(request, adminUser);
        Shelter savedShelter = shelterRepository.save(shelter);
        
        return shelterMapper.toResponse(savedShelter);
    }

    @Transactional(readOnly = true)
    public ShelterResponse getShelterById(Long id) {
        Shelter shelter = shelterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Притулок з ID " + id + " не знайдено"));
        
        return shelterMapper.toResponse(shelter);
    }

    @Transactional
    public ShelterResponse updateShelter(Long id, ShelterRequest request) {
        Shelter shelter = shelterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Притулок з ID " + id + " не знайдено"));

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
}