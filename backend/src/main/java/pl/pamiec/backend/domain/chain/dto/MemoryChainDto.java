package pl.pamiec.backend.domain.chain.dto;

import pl.pamiec.backend.domain.chain.ChainStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MemoryChainDto(
    UUID id,
    UUID userId,
    String topic,
    String language,
    String targetLanguage,
    List<String> rawItems,
    ChainStatus status,
    Instant createdAt,
    List<StoryCardDto> cards
) {}
