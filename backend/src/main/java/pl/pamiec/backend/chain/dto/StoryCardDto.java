package pl.pamiec.backend.chain.dto;

import java.util.UUID;

public record StoryCardDto(
    UUID id,
    int sequenceIndex,
    String targetItem,
    String storySegment,
    String imagePrompt,
    String imageUrl,
    String audioUrl
) {}
