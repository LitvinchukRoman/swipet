package ua.edu.ukma.swipet.backend.auth.dto;

public record RegisterResponse(
        Long userId,
        String message,
        TokenResponse tokens
) { }
