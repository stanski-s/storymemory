package pl.pamiec.backend.domain.chain.dto;

import java.util.UUID;

public record StoryCardDto(
    UUID id,
    int sequenceIndex,
    String targetItem,
    String storySegment,
    String imagePrompt,
    String imageUrl,
    String audioUrl
) {
    public static StoryCardDto fromEntity(pl.pamiec.backend.domain.chain.StoryCard card) {
        return new StoryCardDto(
                card.getId(),
                card.getSequenceIndex(),
                card.getTargetItem(),
                card.getStorySegment(),
                card.getImagePrompt(),
                card.getImageUrl(),
                card.getAudioUrl()
        );
    }
}
