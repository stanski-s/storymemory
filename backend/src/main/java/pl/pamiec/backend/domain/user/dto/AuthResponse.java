package pl.pamiec.backend.domain.user.dto;

public record AuthResponse(String accessToken, UserDto user) {}
