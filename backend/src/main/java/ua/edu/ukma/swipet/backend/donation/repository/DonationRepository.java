package ua.edu.ukma.swipet.backend.donation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.donation.entity.Donation;
import ua.edu.ukma.swipet.backend.donation.entity.DonationStatus;
import ua.edu.ukma.swipet.backend.donation.entity.DonationType;

import java.util.Optional;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {
    Optional<Donation> findByExternalTxId(String externalTxId);

    boolean existsByUser_IdAndAnimal_IdAndTypeAndStatus(
            Long userId, Long animalId, DonationType type, DonationStatus status);

    /**
     * Транзакційний advisory-lock Postgres для серіалізації крон-задачі рекурентних
     * платежів між кількома інстансами застосунку. Автоматично звільняється в кінці
     * транзакції. Повертає false, якщо лок уже утримує інший інстанс.
     */
    @Query(value = "SELECT pg_try_advisory_xact_lock(:key)", nativeQuery = true)
    boolean tryAdvisoryLock(@Param("key") long key);
}