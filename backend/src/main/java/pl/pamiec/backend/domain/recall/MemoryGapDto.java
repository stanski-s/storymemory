package pl.pamiec.backend.domain.recall;

import pl.pamiec.backend.domain.chain.StoryCard;

import java.util.UUID;

public record MemoryGapDto(
        UUID id,
        int sequenceIndex,
        String targetItem,
        String userSubmittedText,
        boolean isCorrect,
        boolean hintTier1Revealed,
        boolean hintTier2Revealed,
        StoryCard storyCard
) {}
