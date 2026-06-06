package ua.edu.ukma.swipet.backend.animal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "animals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelter_id", nullable = false)
    private Shelter shelter;

    @Column(nullable = false, length = 100)
    private String name;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "species", nullable = false, columnDefinition = "animal_species")
    private Species species;

    @Column(length = 100)
    private String breed;

    @Column(name = "age_months", nullable = false)
    private Integer ageMonths;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "size", nullable = false, columnDefinition = "animal_size")
    private Size size;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "gender", nullable = false, columnDefinition = "animal_gender")
    private Gender gender;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_vaccinated", nullable = false)
    @Builder.Default
    private Boolean isVaccinated = false;

    @Column(name = "is_sterilized", nullable = false)
    @Builder.Default
    private Boolean isSterilized = false;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "animal_status")
    private AnimalStatus status;

    @Column(name = "primary_photo_url", columnDefinition = "TEXT")
    private String primaryPhotoUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "animal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AnimalPhoto> photos = new ArrayList<>();
    
    public void addPhoto(AnimalPhoto photo) {
        photos.add(photo);
        photo.setAnimal(this);
    }

    public void removePhoto(AnimalPhoto photo) {
        photos.remove(photo);
        photo.setAnimal(null);
    }
}