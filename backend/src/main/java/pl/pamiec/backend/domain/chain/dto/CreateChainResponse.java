package pl.pamiec.backend.domain.chain.dto;

import java.util.UUID;

public record CreateChainResponse(
    UUID id,
    String status
) {}
