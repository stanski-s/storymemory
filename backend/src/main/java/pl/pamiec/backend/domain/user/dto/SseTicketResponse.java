package pl.pamiec.backend.domain.user.dto;

import java.time.Instant;

public record SseTicketResponse(String ticket, Instant expiresAt) {}
