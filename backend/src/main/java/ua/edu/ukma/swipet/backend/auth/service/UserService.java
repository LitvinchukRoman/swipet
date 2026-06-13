package ua.edu.ukma.swipet.backend.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ua.edu.ukma.swipet.backend.auth.dto.UpdateProfileRequest;
import ua.edu.ukma.swipet.backend.auth.dto.UserResponse;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.common.storage.StorageService;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StorageService storageService;

    private User require(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Користувача не знайдено"));
    }

    /** Часткове оновлення профілю (ТЗ 3.2). null-поля не змінюються. */
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = require(userId);
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone().isBlank() ? null : request.phone());
        }
        if (request.avatarUrl() != null && !request.avatarUrl().isBlank()) {
            // Дозволяємо лише URL із нашого сховища (отриманий через POST /users/me/avatar).
            // Довільний зовнішній URL ігноруємо — інакше профіль можна «прикрасити»
            // hotlink-ом чи підмінити аватар чужим storage-URL.
            if (storageService.isOwnedUrl(request.avatarUrl())) {
                user.setAvatarUrl(request.avatarUrl());
            } else {
                log.warn("Відхилено сторонній avatarUrl для user id={}: {}", userId, request.avatarUrl());
            }
        }
        return UserResponse.from(user);
    }

    /** Оновлення геолокації користувача. */
    @Transactional
    public void updateLocation(Long userId, BigDecimal lat, BigDecimal lng) {
        User user = require(userId);
        user.setLocationLat(lat);
        user.setLocationLng(lng);
    }

    /** Завантаження аватара: видаляє старий файл, зберігає новий, повертає URL. */
    @Transactional
    public String uploadAvatar(Long userId, MultipartFile file) {
        User user = require(userId);
        if (user.getAvatarUrl() != null && !user.getAvatarUrl().isBlank()) {
            storageService.deleteFile(user.getAvatarUrl());
        }
        String url = storageService.uploadFile(file);
        user.setAvatarUrl(url);
        return url;
    }
}
