package ua.edu.ukma.swipet.backend.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class AnimalAnalyticsId implements Serializable {

    @Column(name = "animal_id")
    private Long animalId;

    @Column(name = "date")
    private LocalDate date;
}