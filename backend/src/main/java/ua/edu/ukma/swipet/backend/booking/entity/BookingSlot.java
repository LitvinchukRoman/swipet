package ua.edu.ukma.swipet.backend.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;

import java.time.LocalDateTime;

@Entity
@Table(name = "booking_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelter_id", nullable = false)
    private Shelter shelter;

    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "ends_at", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "max_guests", nullable = false)
    private Integer maxGuests;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "booking_status")
    @Builder.Default
    private BookingStatus status = BookingStatus.AVAILABLE;

    @Version
    private Long version;
}