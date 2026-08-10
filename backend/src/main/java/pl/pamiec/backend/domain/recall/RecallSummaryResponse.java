package pl.pamiec.backend.domain.recall;

import java.util.List;
import java.util.UUID;

public record RecallSummaryResponse(
        UUID chainId,
        int totalSessions,
        Double latestAccuracyScore,
        Double averageAccuracyScore,
        Double bestAccuracyScore,
        RecallSessionResult latestSession,
        List<MemoryGapDto> latestSessionGaps
) {}
