package pl.pamiec.backend.domain.user.dto;

public record RegisterRequest(String email, String password, String displayName) {}
