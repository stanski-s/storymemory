package pl.pamiec.backend.chain.dto;

import java.util.UUID;

public record CreateChainResponse(
    UUID id,
    String status
) {}
