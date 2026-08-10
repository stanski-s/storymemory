package pl.pamiec.backend.domain.recall;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RecallSessionResult(
        UUID sessionId,
        UUID chainId,
        double accuracyScore,
        int totalItems,
        int correctCount,
        int gapCount,
        String mode,
        List<MemoryGapDto> gaps,
        Instant createdAt
) {}
