package pl.pamiec.backend.chain.dto;

import java.util.List;

public record GeneratedCardSegment(
    int sequenceIndex,
    String targetItem,
    String storySegment,
    String imagePrompt
) {}
