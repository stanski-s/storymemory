package pl.pamiec.backend.domain.chain.dto;

import pl.pamiec.backend.domain.chain.ChainStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MemoryChainDto(
    UUID id,
    String userId,
    String topic,
    List<String> rawItems,
    ChainStatus status,
    Instant createdAt,
    List<StoryCardDto> cards
) {
    public static MemoryChainDto fromEntity(pl.pamiec.backend.domain.chain.MemoryChain chain) {
        List<String> items = chain.getRawItems() != null ? java.util.Arrays.asList(chain.getRawItems().split(",")) : java.util.Collections.emptyList();
        List<StoryCardDto> cardDtos = chain.getCards() != null ? chain.getCards().stream().map(StoryCardDto::fromEntity).toList() : java.util.Collections.emptyList();
        return new MemoryChainDto(
                chain.getId(),
                chain.getUserId(),
                chain.getTopic(),
                items,
                chain.getStatus(),
                chain.getCreatedAt(),
                cardDtos
        );
    }
}
