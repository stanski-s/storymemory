package pl.pamiec.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long accessExpirationMs = 15 * 60 * 1000; // 15 minutes
    private final Map<String, SseTicketInfo> sseTicketStore = new ConcurrentHashMap<>();

    public record SseTicketInfo(UUID userId, Instant expiresAt) {}

    public JwtService(@Value("${jwt.secret:default-very-secure-jwt-secret-key-that-is-at-least-256-bits-long!}") String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            this.secretKey = Keys.hmacShaKeyFor(padded);
        } else {
            this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        }
    }

    public String generateAccessToken(UUID userId, String email) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessExpirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey)
                .compact();
    }

    public UUID extractUserId(String token) {
        Claims claims = parseClaims(token);
        return UUID.fromString(claims.getSubject());
    }

    public String extractEmail(String token) {
        Claims claims = parseClaims(token);
        return claims.get("email", String.class);
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // SSE Ticket generation & single-use validation
    public String createSseTicket(UUID userId) {
        String ticket = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(30);
        sseTicketStore.put(ticket, new SseTicketInfo(userId, expiresAt));
        cleanupExpiredTickets();
        return ticket;
    }

    public UUID consumeSseTicket(String ticket) {
        if (ticket == null) return null;
        SseTicketInfo info = sseTicketStore.remove(ticket);
        if (info == null || info.expiresAt().isBefore(Instant.now())) {
            return null;
        }
        return info.userId();
    }

    private void cleanupExpiredTickets() {
        Instant now = Instant.now();
        sseTicketStore.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }
}
