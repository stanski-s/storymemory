package pl.pamiec.backend.domain.recall;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/chains/{chainId}/recall")
public class RecallController {

    private final RecallEvaluationService recallEvaluationService;

    public RecallController(RecallEvaluationService recallEvaluationService) {
        this.recallEvaluationService = recallEvaluationService;
    }

    @PostMapping
    public ResponseEntity<RecallSessionResult> evaluateRecallSession(
            @PathVariable UUID chainId,
            @RequestBody SubmitRecallRequest request) {

        RecallSessionResult result = recallEvaluationService.evaluateAndSaveSession(chainId, request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/summary")
    public ResponseEntity<RecallSummaryResponse> getRecallSummary(@PathVariable UUID chainId) {
        RecallSummaryResponse summary = recallEvaluationService.getChainRecallSummary(chainId);
        return ResponseEntity.ok(summary);
    }
}
