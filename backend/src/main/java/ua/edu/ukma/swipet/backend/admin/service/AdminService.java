package ua.edu.ukma.swipet.backend.admin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.admin.dto.AdminStatsResponse;
import ua.edu.ukma.swipet.backend.admin.dto.CreateShelterRequest;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.auth.dto.UserResponse;
import ua.edu.ukma.swipet.backend.auth.entity.Role;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.shelter.dto.ShelterResponse;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;
import ua.edu.ukma.swipet.backend.shelter.mapper.ShelterMapper;
import ua.edu.ukma.swipet.backend.shelter.repository.ShelterRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ShelterRepository shelterRepository;
    private final AnimalRepository animalRepository;
    private final ShelterMapper shelterMapper;

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long pending = shelterRepository.findAll().stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsVerified()))
                .count();
        return new AdminStatsResponse(
                userRepository.count(),
                shelterRepository.count(),
                animalRepository.count(),
                pending
        );
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse updateUserRole(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Користувача з ID " + userId + " не знайдено"));
        user.setRole(role);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<ShelterResponse> listShelters() {
        return shelterRepository.findAll().stream()
                .map(shelterMapper::toResponse)
                .toList();
    }

    /**
     * Створює притулок і призначає адміністратором наявного користувача (за email),
     * піднімаючи його роль до SHELTER_ADMIN (Модель B). Один користувач — один притулок.
     */
    @Transactional
    public ShelterResponse createShelterForUser(CreateShelterRequest req) {
        User admin = userRepository.findByEmail(req.adminEmail())
                .orElseThrow(() -> AppException.notFound("Користувача з email " + req.adminEmail() + " не знайдено"));

        if (shelterRepository.findByAdminUser_Id(admin.getId()).isPresent()) {
            throw AppException.conflict("Цей користувач уже керує притулком");
        }

        admin.setRole(Role.SHELTER_ADMIN);
        userRepository.save(admin);

        Shelter shelter = Shelter.builder()
                .adminUser(admin)
                .name(req.name())
                .description(req.description())
                .address(req.address())
                .city(req.city())
                .locationLat(req.locationLat())
                .locationLng(req.locationLng())
                .phone(req.phone())
                .websiteUrl(req.websiteUrl())
                .build();

        return shelterMapper.toResponse(shelterRepository.save(shelter));
    }

    @Transactional
    public ShelterResponse setVerified(Long shelterId, boolean verified) {
        Shelter shelter = shelterRepository.findById(shelterId)
                .orElseThrow(() -> AppException.notFound("Притулок з ID " + shelterId + " не знайдено"));
        shelter.setIsVerified(verified);
        return shelterMapper.toResponse(shelterRepository.save(shelter));
    }
}
