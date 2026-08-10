package pl.pamiec.backend.domain.recall;

public record RecallAnswerItem(
        int sequenceIndex,
        String userText,
        boolean hintTier1Revealed,
        boolean hintTier2Revealed
) {}
