package pl.pamiec.backend.chain.dto;

import java.util.List;

public record GeneratedStoryChain(
    List<GeneratedCardSegment> cards
) {}
