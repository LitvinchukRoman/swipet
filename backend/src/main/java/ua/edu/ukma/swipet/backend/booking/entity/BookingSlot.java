package ua.edu.ukma.swipet.backend.booking.entity;

import jakarta.persistence.*;
import lombok.*;
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

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "max_guests", nullable = false)
    private Integer maxGuests;

    @Version
    private Long version;
}