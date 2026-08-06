package pl.pamiec.backend.domain.chain.dto;

import java.util.List;
import java.util.UUID;

public record CreateChainRequest(
    UUID userId,
    String topic,
    String targetLanguage,
    List<String> items
) {
    public CreateChainRequest {
        if (userId == null) {
            userId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
        if (targetLanguage == null || targetLanguage.isBlank()) {
            targetLanguage = "English";
        }
    }
}
