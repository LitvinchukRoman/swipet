package ua.edu.ukma.swipet.backend.auth.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "swipet.jwt")
public record JwtProperties(
        @NotBlank
        @Size(min = 32, message = "JWT secret must be at least 32 chars / 256 bit")
        String secret,

        @Min(60)
        long accessExpirationSeconds,

        @Min(60)
        long refreshExpirationSeconds,

        @NotBlank
        String issuer
) { }
