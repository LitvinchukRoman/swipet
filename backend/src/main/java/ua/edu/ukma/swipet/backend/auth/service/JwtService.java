package ua.edu.ukma.swipet.backend.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ua.edu.ukma.swipet.backend.auth.config.JwtProperties;
import ua.edu.ukma.swipet.backend.auth.entity.Role;
import ua.edu.ukma.swipet.backend.auth.entity.User;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

/**
 * Bearer access токен — підписаний JWT (HS256) з наступними claims:
 * <ul>
 *   <li>{@code sub} — userId</li>
 *   <li>{@code email}</li>
 *   <li>{@code role}</li>
 *   <li>{@code iat}, {@code exp}, {@code iss}</li>
 * </ul>
 *
 * Refresh токен в системі — це opaque UUID збережений у БД (див. {@code RefreshToken}),
 * тому JwtService має лише helper {@link #generateRefreshTokenValue()} для генерації UUID.
 */
@Slf4j
@Service
public class JwtService {

    private final JwtProperties props;
    private final SecretKey signingKey;

    public JwtService(JwtProperties props) {
        this.props = props;
        this.signingKey = Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.accessExpirationSeconds());

        return Jwts.builder()
                .issuer(props.issuer())
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public java.util.UUID generateRefreshTokenValue() {
        return java.util.UUID.randomUUID();
    }

    public Duration accessTtl() {
        return Duration.ofSeconds(props.accessExpirationSeconds());
    }

    public Duration refreshTtl() {
        return Duration.ofSeconds(props.refreshExpirationSeconds());
    }

    public boolean validateToken(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parse(token).getPayload().getSubject());
    }

    public String extractEmail(String token) {
        return parse(token).getPayload().get("email", String.class);
    }

    public Role extractRole(String token) {
        String raw = parse(token).getPayload().get("role", String.class);
        return raw == null ? null : Role.valueOf(raw);
    }

    private Jws<Claims> parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(props.issuer())
                .build()
                .parseSignedClaims(token);
    }
}
