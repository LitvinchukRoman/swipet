package ua.edu.ukma.swipet.backend.donation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.edu.ukma.swipet.backend.donation.entity.VirtualGuardianship;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VirtualGuardianshipRepository extends JpaRepository<VirtualGuardianship, Long> {
    
    List<VirtualGuardianship> findAllByUser_IdAndIsActiveTrue(Long userId);

    @Query("SELECT vg FROM VirtualGuardianship vg WHERE vg.isActive = true AND vg.nextBillingAt <= :now")
    List<VirtualGuardianship> findDueSubscriptions(@Param("now") LocalDateTime now);
}