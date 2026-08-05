package pl.pamiec.backend.chain.dto;

import pl.pamiec.backend.chain.ChainStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MemoryChainDto(
    UUID id,
    String topic,
    String targetLanguage,
    List<String> rawItems,
    ChainStatus status,
    Instant createdAt,
    List<StoryCardDto> cards
) {}
