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
 * Компонент для додаткової авторизації на рівні бізнес-ресурсів (притулків та тварин).
 * Запобігає несанкціонованому редагуванню даних адміністратором одного притулку в профілі чужого.
 * 
 * <p>Платформенний ADMIN проходить будь-яку перевірку. Для SHELTER_ADMIN ресурс має
 * належати саме тому притулку, де цей користувач зареєстрований як adminUser.</p>
 */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterOwnershipGuard {

    private final ShelterRepository shelterRepository;
    private final AnimalRepository animalRepository;

    /**
     * Перевіряє, чи має авторизований користувач права на управління притулком.
     * Пропускає перевірку, якщо користувач є платформеним адміністратором.
     *
     * @param user Поточний авторизований користувач
     * @param shelterId ID притулку для перевірки
     * @throws AppException.notFound якщо притулок не знайдено
     * @throws AppException.forbidden якщо користувач не є адміністратором цього притулку
     */
    public void assertCanManageShelter(AuthenticatedUser user, Long shelterId) {
        if (isPlatformAdmin(user)) {
            return;
        }
        Shelter shelter = shelterRepository.findById(shelterId)
                .orElseThrow(() -> AppException.notFound("Притулок не знайдено"));
        ensureOwner(user, shelter);
    }

    /**
     * Перевіряє, чи має авторизований користувач права на управління конкретною твариною.
     * Права визначаються через приналежність тварини до притулку користувача.
     *
     * @param user Поточний авторизований користувач
     * @param animalId ID тварини для перевірки
     * @throws AppException.notFound якщо тварину не знайдено
     * @throws AppException.forbidden якщо тварина належить притулку іншого адміністратора
     */
    public void assertCanManageAnimal(AuthenticatedUser user, Long animalId) {
        if (isPlatformAdmin(user)) {
            return;
        }
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> AppException.notFound("Тварину не знайдено"));
        ensureOwner(user, animal.getShelter());
    }

    /**
     * Допоміжний метод для перевірки рівності власника притулку та авторизованого користувача.
     */
    private void ensureOwner(AuthenticatedUser user, Shelter shelter) {
        if (shelter == null || shelter.getAdminUser() == null
                || !shelter.getAdminUser().getId().equals(user.id())) {
            throw AppException.forbidden("Притулок належить іншому адміністратору");
        }
    }

    /**
     * Перевіряє, чи має користувач глобальну роль адміністратора платформи (ADMIN).
     */
    private boolean isPlatformAdmin(AuthenticatedUser user) {
        return user.role() == Role.ADMIN;
    }
}
