package pl.pamiec.backend.domain.chain.dto;

public record GeneratedCardSegment(
    int sequenceIndex,
    String targetItem,
    String storySegment,
    String imagePrompt
) {}
