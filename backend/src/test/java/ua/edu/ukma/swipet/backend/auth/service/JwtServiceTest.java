package ua.edu.ukma.swipet.backend.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ua.edu.ukma.swipet.backend.auth.config.JwtProperties;
import ua.edu.ukma.swipet.backend.auth.entity.Role;
import ua.edu.ukma.swipet.backend.auth.entity.User;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties(
                "test-secret-test-secret-test-secret-test-secret-1234",
                900L,
                604_800L,
                "swipet-test"
        );
        jwtService = new JwtService(props);
    }

    @Test
    void generateValidateExtract_roundTrip() {
        User user = User.builder()
                .id(42L)
                .email("alice@swipet.io")
                .role(Role.SHELTER_ADMIN)
                .build();

        String token = jwtService.generateAccessToken(user);

        assertThat(jwtService.validateToken(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtService.extractEmail(token)).isEqualTo("alice@swipet.io");
        assertThat(jwtService.extractRole(token)).isEqualTo(Role.SHELTER_ADMIN);
    }

    @Test
    void validateToken_returnsFalseForGarbage() {
        assertThat(jwtService.validateToken("not.a.jwt")).isFalse();
        assertThat(jwtService.validateToken("")).isFalse();
    }

    @Test
    void validateToken_returnsFalseForDifferentSecret() {
        JwtProperties otherProps = new JwtProperties(
                "another-secret-another-secret-another-secret-1234",
                900L,
                604_800L,
                "swipet-test"
        );
        JwtService otherService = new JwtService(otherProps);
        String token = otherService.generateAccessToken(
                User.builder().id(1L).email("e@x.io").role(Role.USER).build()
        );

        assertThat(jwtService.validateToken(token)).isFalse();
    }

    @Test
    void generateRefreshTokenValue_returnsRandomUuid() {
        java.util.UUID a = jwtService.generateRefreshTokenValue();
        java.util.UUID b = jwtService.generateRefreshTokenValue();
        assertThat(a).isNotNull().isNotEqualTo(b);
    }
}
