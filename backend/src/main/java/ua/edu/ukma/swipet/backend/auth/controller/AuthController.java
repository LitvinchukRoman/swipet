package ua.edu.ukma.swipet.backend.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.edu.ukma.swipet.backend.auth.dto.LoginRequest;
import ua.edu.ukma.swipet.backend.auth.dto.RefreshTokenRequest;
import ua.edu.ukma.swipet.backend.auth.dto.RegisterRequest;
import ua.edu.ukma.swipet.backend.auth.dto.RegisterResponse;
import ua.edu.ukma.swipet.backend.auth.dto.TokenResponse;
import ua.edu.ukma.swipet.backend.auth.dto.UserResponse;
import ua.edu.ukma.swipet.backend.auth.security.AuthenticatedUser;
import ua.edu.ukma.swipet.backend.auth.security.CurrentUser;
import ua.edu.ukma.swipet.backend.auth.service.AuthService;
import ua.edu.ukma.swipet.backend.common.exception.AppException;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication & token lifecycle")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new user, returns issued token pair")
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest req) {
        RegisterResponse resp = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @Operation(summary = "Login with email & password, returns access + refresh tokens")
    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @Operation(summary = "Exchange a refresh token for a new pair (refresh-token rotation)")
    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return authService.refresh(req.refreshToken());
    }

    @Operation(summary = "Revoke the supplied refresh token", security = @SecurityRequirement(name = "bearer-jwt"))
    @PostMapping("/logout")
    public Map<String, String> logout(@Valid @RequestBody RefreshTokenRequest req) {
        authService.logout(req.refreshToken());
        return Map.of("message", "logged out");
    }

    @Operation(summary = "Currently authenticated user profile", security = @SecurityRequirement(name = "bearer-jwt"))
    @GetMapping("/me")
    public UserResponse me(@CurrentUser AuthenticatedUser principal) {
        if (principal == null) {
            throw AppException.unauthorized("Authentication required");
        }
        return authService.me(principal.id());
    }

    /**
     * Чат-сервіс на Node.js дзвонить цей ендпоінт перед апгрейдом WebSocket-з'єднання,
     * щоб переконатись що access token валідний (JWT validate) і знайти userId.
     */
    @Operation(summary = "Verify the supplied JWT (used by chat-service)", security = @SecurityRequirement(name = "bearer-jwt"))
    @GetMapping("/verify")
    public Map<String, Object> verify(@CurrentUser AuthenticatedUser principal) {
        if (principal == null) {
            throw AppException.unauthorized("Invalid or missing token");
        }
        return Map.of(
                "valid", true,
                "userId", principal.id(),
                "role", principal.role().name()
        );
    }
}
