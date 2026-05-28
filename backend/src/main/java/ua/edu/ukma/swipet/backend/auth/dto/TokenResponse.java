package ua.edu.ukma.swipet.backend.auth.dto;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {
    public static TokenResponse of(String access, String refresh, long expiresIn, UserResponse user) {
        return new TokenResponse(access, refresh, "Bearer", expiresIn, user);
    }
}
