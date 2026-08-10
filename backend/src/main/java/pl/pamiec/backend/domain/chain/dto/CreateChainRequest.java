package pl.pamiec.backend.domain.chain.dto;

import java.util.List;

public record CreateChainRequest(
    String userId,
    String topic,
    List<String> items
) {
    public CreateChainRequest {
        if (userId == null || userId.isBlank()) {
            userId = "00000000-0000-0000-0000-000000000000";
        }
    }
}
