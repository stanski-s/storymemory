package pl.pamiec.backend.chain.dto;

import pl.pamiec.backend.chain.ChainStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MemoryChainDto(
    UUID id,
    String userId,
    String topic,
    String language,
    String targetLanguage,
    List<String> rawItems,
    ChainStatus status,
    Instant createdAt,
    List<StoryCardDto> cards
) {
    public MemoryChainDto(UUID id, String topic, String language, List<String> rawItems, ChainStatus status, Instant createdAt, List<StoryCardDto> cards) {
        this(id, null, topic, language, language, rawItems, status, createdAt, cards);
    }
}

