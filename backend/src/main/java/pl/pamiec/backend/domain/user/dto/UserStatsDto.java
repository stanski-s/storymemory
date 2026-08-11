package pl.pamiec.backend.domain.user.dto;

public record UserStatsDto(
        long totalChains,
        long totalRecallSessions,
        double averageAccuracyScore,
        long totalMemoryGaps
) {}
