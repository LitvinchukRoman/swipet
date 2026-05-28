package ua.edu.ukma.swipet.backend.animal.repository;

public interface FeedAnimalProjection {
    Long getId();
    String getName();
    String getSpecies();
    Integer getAgeMonths();
    String getSize();
    String getPrimaryPhotoUrl();
    String getShelterName();
    Double getDistanceKm();
}