package ua.edu.ukma.swipet.backend.common.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.auth.entity.Role;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;
import ua.edu.ukma.swipet.backend.shelter.repository.ShelterRepository;

/**
 * Перевірки володіння притулком. Роль (SHELTER_ADMIN/ADMIN) гейтиться через
 * {@code @PreAuthorize} на рівні контролера, але цього недостатньо: адмін одного
 * притулку не повинен мати змоги редагувати тварин/слоти/профіль ЧУЖОГО притулку.
 *
 * <p>Платформенний {@link Role#ADMIN} проходить будь-яку перевірку. Для
 * {@link Role#SHELTER_ADMIN} ресурс має належати притулку, де він — {@code adminUser}.
 */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterOwnershipGuard {

    private final ShelterRepository shelterRepository;
    private final AnimalRepository animalRepository;

    /** Чи може користувач керувати цим притулком. */
    public void assertCanManageShelter(AuthenticatedUser user, Long shelterId) {
        if (isPlatformAdmin(user)) {
            return;
        }
        Shelter shelter = shelterRepository.findById(shelterId)
                .orElseThrow(() -> AppException.notFound("Притулок не знайдено"));
        ensureOwner(user, shelter);
    }

    /** Чи може користувач керувати твариною (через притулок, до якого вона належить). */
    public void assertCanManageAnimal(AuthenticatedUser user, Long animalId) {
        if (isPlatformAdmin(user)) {
            return;
        }
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> AppException.notFound("Тварину не знайдено"));
        ensureOwner(user, animal.getShelter());
    }

    private void ensureOwner(AuthenticatedUser user, Shelter shelter) {
        if (shelter == null || shelter.getAdminUser() == null
                || !shelter.getAdminUser().getId().equals(user.id())) {
            throw AppException.forbidden("Притулок належить іншому адміністратору");
        }
    }

    private boolean isPlatformAdmin(AuthenticatedUser user) {
        return user.role() == Role.ADMIN;
    }
}
