package pl.pamiec.backend.domain.recall;

import java.util.List;

public record SubmitRecallRequest(
        String mode,
        List<RecallAnswerItem> responses
) {}
