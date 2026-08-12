package pl.pamiec.backend.domain.user;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pl.pamiec.backend.domain.user.dto.*;

import java.util.Arrays;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final boolean secureCookie;

    public AuthController(AuthService authService,
                          UserRepository userRepository,
                          @Value("${app.secure-cookie:false}") boolean secureCookie) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.secureCookie = secureCookie;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @jakarta.validation.Valid RegisterRequest request,
                                                HttpServletRequest servletRequest,
                                                HttpServletResponse servletResponse) {
        String clientIp = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");

        AuthService.AuthResult result = authService.register(request, clientIp, userAgent);
        setRefreshTokenCookie(servletResponse, result.refreshTokenValue());
        return ResponseEntity.status(HttpStatus.CREATED).body(result.response());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @jakarta.validation.Valid LoginRequest request,
                                             HttpServletRequest servletRequest,
                                             HttpServletResponse servletResponse) {
        String clientIp = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");

        AuthService.AuthResult result = authService.login(request, clientIp, userAgent);
        setRefreshTokenCookie(servletResponse, result.refreshTokenValue());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@CookieValue(name = "refreshToken", required = false) String rawRefreshToken,
                                               HttpServletRequest servletRequest,
                                               HttpServletResponse servletResponse) {
        String clientIp = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");

        AuthService.AuthResult result = authService.refresh(rawRefreshToken, clientIp, userAgent);
        setRefreshTokenCookie(servletResponse, result.refreshTokenValue());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = "refreshToken", required = false) String rawRefreshToken,
                                       HttpServletResponse servletResponse) {
        authService.logout(rawRefreshToken);
        clearRefreshTokenCookie(servletResponse);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sse-ticket")
    public ResponseEntity<SseTicketResponse> createSseTicket(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID userId = UUID.fromString(authentication.getName());
        SseTicketResponse ticketResponse = authService.createSseTicket(userId);
        return ResponseEntity.ok(ticketResponse);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID userId = UUID.fromString(authentication.getName());
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(new UserDto(user.getId(), user.getEmail(), user.getDisplayName())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshTokenValue) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshTokenValue)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/api/auth/refresh")
                .maxAge(7 * 24 * 3600)
                .sameSite("Strict")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(secureCookie)
                .path("/api/auth/refresh")
                .maxAge(0)
                .sameSite("Strict")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
