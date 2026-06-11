package ua.edu.ukma.swipet.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotBlank
        // Max 72: BCrypt silently caps (and actually throws) above 72 bytes,
        // so accepting longer passwords would crash the encoder with a 500.
        @Size(min = 8, max = 72, message = "Password must be 8..72 chars")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                message = "Password must contain at least one letter and one digit"
        )
        String password,

        @NotBlank
        @Size(min = 2, max = 100)
        String fullName
) { }
