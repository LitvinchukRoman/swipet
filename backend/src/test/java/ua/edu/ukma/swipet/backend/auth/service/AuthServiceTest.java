package ua.edu.ukma.swipet.backend.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import ua.edu.ukma.swipet.backend.auth.config.JwtProperties;
import ua.edu.ukma.swipet.backend.auth.dto.LoginRequest;
import ua.edu.ukma.swipet.backend.auth.dto.RegisterRequest;
import ua.edu.ukma.swipet.backend.auth.dto.RegisterResponse;
import ua.edu.ukma.swipet.backend.auth.dto.TokenResponse;
import ua.edu.ukma.swipet.backend.auth.entity.RefreshToken;
import ua.edu.ukma.swipet.backend.auth.entity.Role;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.RefreshTokenRepository;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.common.exception.AppException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(new JwtProperties(
                "test-secret-test-secret-test-secret-test-secret-1234", 900L, 604_800L, "swipet-test"
        ));
        authService = new AuthService(userRepository, refreshTokenRepository, passwordEncoder, jwtService);
    }

    @Test
    void register_createsUser_andReturnsTokens() {
        RegisterRequest req = new RegisterRequest("Alice@Swipet.IO", "Password1!", "Alice");
        when(userRepository.existsByEmail("alice@swipet.io")).thenReturn(false);
        when(passwordEncoder.encode("Password1!")).thenReturn("HASH");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(7L);
            return u;
        });

        RegisterResponse resp = authService.register(req);

        ArgumentCaptor<User> userCap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCap.capture());
        assertThat(userCap.getValue().getEmail()).isEqualTo("alice@swipet.io");
        assertThat(userCap.getValue().getPasswordHash()).isEqualTo("HASH");
        assertThat(userCap.getValue().getRole()).isEqualTo(Role.USER);

        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
        assertThat(resp.userId()).isEqualTo(7L);
        assertThat(resp.tokens().accessToken()).isNotBlank();
        assertThat(resp.tokens().refreshToken()).isNotBlank();
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        RegisterRequest req = new RegisterRequest("dup@swipet.io", "Password1", "Bob");
        when(userRepository.existsByEmail("dup@swipet.io")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("already in use");

        verify(userRepository, never()).save(any());
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void login_correctPassword_returnsTokens() {
        User user = User.builder()
                .id(1L).email("alice@swipet.io").passwordHash("HASH").role(Role.USER).build();
        when(userRepository.findByEmail("alice@swipet.io")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("plain", "HASH")).thenReturn(true);

        TokenResponse resp = authService.login(new LoginRequest("Alice@Swipet.io", "plain"));

        assertThat(resp.accessToken()).isNotBlank();
        assertThat(resp.refreshToken()).isNotBlank();
        assertThat(resp.user().email()).isEqualTo("alice@swipet.io");
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void login_wrongPassword_throwsUnauthorized() {
        User user = User.builder()
                .id(1L).email("alice@swipet.io").passwordHash("HASH").role(Role.USER).build();
        when(userRepository.findByEmail("alice@swipet.io")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("nope", "HASH")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("alice@swipet.io", "nope")))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Invalid credentials");

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void login_unknownEmail_throwsUnauthorized() {
        when(userRepository.findByEmail("ghost@swipet.io")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@swipet.io", "x")))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void refresh_validToken_rotatesAndReturnsNewPair() {
        User user = User.builder().id(11L).email("u@s.io").role(Role.USER).build();
        UUID raw = UUID.randomUUID();
        RefreshToken stored = RefreshToken.builder()
                .id(99L)
                .token(raw)
                .userId(11L)
                .expiresAt(Instant.now().plusSeconds(3600))
                .isRevoked(false)
                .build();
        when(refreshTokenRepository.findByToken(raw)).thenReturn(Optional.of(stored));
        when(userRepository.findById(11L)).thenReturn(Optional.of(user));

        TokenResponse resp = authService.refresh(raw.toString());

        assertThat(stored.getIsRevoked()).isTrue();
        assertThat(resp.refreshToken()).isNotEqualTo(raw.toString());
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    void refresh_expiredToken_throws() {
        UUID raw = UUID.randomUUID();
        RefreshToken stored = RefreshToken.builder()
                .token(raw).userId(1L)
                .expiresAt(Instant.now().minusSeconds(1))
                .isRevoked(false).build();
        when(refreshTokenRepository.findByToken(raw)).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> authService.refresh(raw.toString()))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("expired or revoked");
    }

    @Test
    void logout_marksTokenRevoked() {
        UUID raw = UUID.randomUUID();
        RefreshToken stored = RefreshToken.builder()
                .token(raw).userId(1L)
                .expiresAt(Instant.now().plusSeconds(3600))
                .isRevoked(false).build();
        when(refreshTokenRepository.findByToken(raw)).thenReturn(Optional.of(stored));

        authService.logout(raw.toString());

        assertThat(stored.getIsRevoked()).isTrue();
        verify(refreshTokenRepository).save(stored);
    }
}
