package pl.pamiec.backend.domain.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.pamiec.backend.domain.user.dto.*;
import pl.pamiec.backend.security.JwtService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private static final long REFRESH_TOKEN_VALIDITY_SECONDS = 7 * 24 * 3600; // 7 days

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResult register(RegisterRequest request, String clientIp, String userAgent) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        String encodedPassword = passwordEncoder.encode(request.password());
        User user = new User(request.email().toLowerCase().trim(), encodedPassword, request.displayName());
        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String refreshTokenValue = generateAndSaveRefreshToken(user, clientIp, userAgent);

        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getDisplayName());
        return new AuthResult(new AuthResponse(accessToken, userDto), refreshTokenValue);
    }

    @Transactional
    public AuthResult login(LoginRequest request, String clientIp, String userAgent) {
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String refreshTokenValue = generateAndSaveRefreshToken(user, clientIp, userAgent);

        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getDisplayName());
        return new AuthResult(new AuthResponse(accessToken, userDto), refreshTokenValue);
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken, String clientIp, String userAgent) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token is required");
        }

        String hash = hashToken(rawRefreshToken);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (storedToken.isRevoked()) {
            // FRAUD DETECTED: Token was reused! Revoke all tokens for this user immediately!
            refreshTokenRepository.revokeAllForUser(storedToken.getUser());
            throw new SecurityException("Revoked refresh token reuse detected. All sessions invalidated.");
        }

        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            storedToken.setRevoked(true);
            refreshTokenRepository.save(storedToken);
            throw new IllegalArgumentException("Expired refresh token");
        }

        // Token Rotation: revoke current token and issue a new one
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        User user = storedToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String newRefreshTokenValue = generateAndSaveRefreshToken(user, clientIp, userAgent);

        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getDisplayName());
        return new AuthResult(new AuthResponse(newAccessToken, userDto), newRefreshTokenValue);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String hash = hashToken(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }
    }

    public SseTicketResponse createSseTicket(UUID userId) {
        String ticket = jwtService.createSseTicket(userId);
        return new SseTicketResponse(ticket, Instant.now().plusSeconds(30));
    }

    private String generateAndSaveRefreshToken(User user, String clientIp, String userAgent) {
        String rawToken = UUID.randomUUID().toString() + "." + UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plusSeconds(REFRESH_TOKEN_VALIDITY_SECONDS);

        RefreshToken refreshToken = new RefreshToken(user, tokenHash, expiresAt, clientIp, userAgent);
        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    public record AuthResult(AuthResponse response, String refreshTokenValue) {}
}
