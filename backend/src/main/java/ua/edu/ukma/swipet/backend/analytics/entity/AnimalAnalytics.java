package ua.edu.ukma.swipet.backend.analytics.entity;

import jakarta.persistence.*;
import lombok.*;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;

@Entity
@Table(name = "animal_analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnimalAnalytics {

    @EmbeddedId
    private AnimalAnalyticsId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("animalId")
    @JoinColumn(name = "animal_id")
    private Animal animal;

    @Column(name = "views_count", nullable = false)
    @Builder.Default
    private Integer viewsCount = 0;

    @Column(name = "swipes_right", nullable = false)
    @Builder.Default
    private Integer swipesRight = 0;

    @Column(name = "swipes_left", nullable = false)
    @Builder.Default
    private Integer swipesLeft = 0;

    @Column(name = "chat_opens", nullable = false)
    @Builder.Default
    private Integer chatOpens = 0;
}