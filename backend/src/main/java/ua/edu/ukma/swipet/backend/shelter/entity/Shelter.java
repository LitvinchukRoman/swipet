package ua.edu.ukma.swipet.backend.shelter.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.auth.entity.User;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shelters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shelter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_user_id", nullable = false)
    private User adminUser;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "location_lat", nullable = false)
    private Double locationLat;

    @Column(name = "location_lng", nullable = false)
    private Double locationLng;

    @Column(length = 20)
    private String phone;

    @Column(name = "website_url", columnDefinition = "TEXT")
    private String websiteUrl;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Зворотний зв'язок з тваринами. Коли притулок видаляється, всі його тварини теж зникають (orphanRemoval)
    @OneToMany(mappedBy = "shelter", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Animal> animals = new ArrayList<>();
}