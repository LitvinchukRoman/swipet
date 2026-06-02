package ua.edu.ukma.swipet.backend.shelter.mapper;

import org.springframework.stereotype.Component;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.shelter.dto.ShelterRequest;
import ua.edu.ukma.swipet.backend.shelter.dto.ShelterResponse;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;

@Component
public class ShelterMapper {

    public Shelter toEntity(ShelterRequest request, User adminUser) {
        return Shelter.builder()
                .adminUser(adminUser)
                .name(request.name())
                .description(request.description())
                .address(request.address())
                .city(request.city())
                .locationLat(request.locationLat())
                .locationLng(request.locationLng())
                .phone(request.phone())
                .websiteUrl(request.websiteUrl())
                .build();
    }

    public ShelterResponse toResponse(Shelter shelter) {
        return new ShelterResponse(
                shelter.getId(),
                shelter.getAdminUser().getId(),
                shelter.getName(),
                shelter.getDescription(),
                shelter.getLogoUrl(),
                shelter.getAddress(),
                shelter.getCity(),
                shelter.getLocationLat(),
                shelter.getLocationLng(),
                shelter.getPhone(),
                shelter.getWebsiteUrl(),
                shelter.getIsVerified(),
                shelter.getCreatedAt()
        );
    }
}