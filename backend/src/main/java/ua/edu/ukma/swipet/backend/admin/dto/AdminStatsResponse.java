package ua.edu.ukma.swipet.backend.admin.dto;

/** Зведені лічильники для огляду адміна (GET /api/v1/admin/stats). */
public record AdminStatsResponse(
        long userCount,
        long shelterCount,
        long animalCount,
        long pendingShelters
) {}
