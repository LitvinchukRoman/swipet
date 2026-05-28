package ua.edu.ukma.swipet.backend.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.auth.dto.LoginRequest;
import ua.edu.ukma.swipet.backend.auth.dto.RegisterRequest;
import ua.edu.ukma.swipet.backend.auth.dto.RegisterResponse;
import ua.edu.ukma.swipet.backend.auth.dto.TokenResponse;
import ua.edu.ukma.swipet.backend.auth.dto.UserResponse;
import ua.edu.ukma.swipet.backend.auth.entity.RefreshToken;
import ua.edu.ukma.swipet.backend.auth.entity.Role;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.RefreshTokenRepository;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.common.exception.AppException;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw AppException.conflict("Email is already in use");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.fullName().trim())
                .role(Role.USER)
                .isEmailVerified(false)
                .build();
        user = userRepository.save(user);

        TokenResponse tokens = issueTokens(user);
        log.info("Registered new user id={} email={}", user.getId(), user.getEmail());
        return new RegisterResponse(user.getId(), "User registered", tokens);
    }

    @Transactional
    public TokenResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.unauthorized("Invalid credentials"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw AppException.unauthorized("Invalid credentials");
        }

        return issueTokens(user);
    }

    @Transactional
    public TokenResponse refresh(String refreshTokenRaw) {
        UUID tokenUuid = parseUuidOrThrow(refreshTokenRaw);
        RefreshToken stored = refreshTokenRepository.findByToken(tokenUuid)
                .orElseThrow(() -> AppException.unauthorized("Invalid refresh token"));

        if (!stored.isActive()) {
            throw AppException.unauthorized("Refresh token expired or revoked");
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> AppException.unauthorized("User no longer exists"));

        // Refresh-token rotation: revoke old, issue a new pair.
        stored.setIsRevoked(true);
        refreshTokenRepository.save(stored);

        return issueTokens(user);
    }

    @Transactional
    public void logout(String refreshTokenRaw) {
        UUID tokenUuid = parseUuidOrThrow(refreshTokenRaw);
        refreshTokenRepository.findByToken(tokenUuid).ifPresent(rt -> {
            rt.setIsRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.unauthorized("User not found"));
        return UserResponse.from(user);
    }

    private TokenResponse issueTokens(User user) {
        String access = jwtService.generateAccessToken(user);
        UUID refresh = jwtService.generateRefreshTokenValue();

        RefreshToken rt = RefreshToken.builder()
                .token(refresh)
                .userId(user.getId())
                .expiresAt(Instant.now().plus(jwtService.refreshTtl()))
                .isRevoked(false)
                .build();
        refreshTokenRepository.save(rt);

        return TokenResponse.of(
                access,
                refresh.toString(),
                jwtService.accessTtl().toSeconds(),
                UserResponse.from(user)
        );
    }

    private UUID parseUuidOrThrow(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            throw AppException.unauthorized("Invalid refresh token format");
        }
    }
}
