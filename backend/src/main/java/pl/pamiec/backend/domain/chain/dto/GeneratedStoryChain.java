package pl.pamiec.backend.domain.chain.dto;

import java.util.List;

public record GeneratedStoryChain(
    List<GeneratedCardSegment> cards
) {}
