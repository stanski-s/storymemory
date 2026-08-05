package pl.pamiec.backend.chain.dto;

import java.util.List;

public record CreateChainRequest(
    String topic,
    String targetLanguage,
    List<String> items
) {}
