package pl.pamiec.backend.domain.chain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateChainRequest(
        String userId,

        @NotBlank(message = "Topic is required")
        @Size(max = 255, message = "Topic must not exceed 255 characters")
        String topic,

        @NotNull(message = "Items list is required")
        @Size(min = 2, max = 30, message = "Items list must contain between 2 and 30 entries")
        List<@NotBlank(message = "Each item must not be blank") @Size(max = 120) String> items
) {
    public CreateChainRequest {
        if (userId == null || userId.isBlank()) {
            userId = "00000000-0000-0000-0000-000000000000";
        }
    }
}
