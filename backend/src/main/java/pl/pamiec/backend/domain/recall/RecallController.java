package pl.pamiec.backend.domain.recall;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pl.pamiec.backend.domain.chain.MemoryChain;
import pl.pamiec.backend.domain.chain.MemoryChainRepository;

import java.util.UUID;

@RestController
@RequestMapping("/api/chains/{chainId}/recall")
public class RecallController {

    private final RecallEvaluationService recallEvaluationService;
    private final MemoryChainRepository chainRepository;

    public RecallController(RecallEvaluationService recallEvaluationService,
                            MemoryChainRepository chainRepository) {
        this.recallEvaluationService = recallEvaluationService;
        this.chainRepository = chainRepository;
    }

    @PostMapping
    public ResponseEntity<RecallSessionResult> evaluateRecallSession(
            @PathVariable UUID chainId,
            @RequestBody SubmitRecallRequest request,
            Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        // Verify ownership to prevent IDOR on recall submission
        MemoryChain chain = chainRepository.findById(chainId).orElse(null);
        if (chain == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        String currentUserId = authentication.getName();
        if (chain.getUserId() != null
                && !chain.getUserId().equals("00000000-0000-0000-0000-000000000000")
                && !chain.getUserId().equalsIgnoreCase(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        RecallSessionResult result = recallEvaluationService.evaluateAndSaveSession(chainId, request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/summary")
    public ResponseEntity<RecallSummaryResponse> getRecallSummary(
            @PathVariable UUID chainId,
            Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        // Verify ownership to prevent IDOR on recall summary
        MemoryChain chain = chainRepository.findById(chainId).orElse(null);
        if (chain == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        String currentUserId = authentication.getName();
        if (chain.getUserId() != null
                && !chain.getUserId().equals("00000000-0000-0000-0000-000000000000")
                && !chain.getUserId().equalsIgnoreCase(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        RecallSummaryResponse summary = recallEvaluationService.getChainRecallSummary(chainId);
        return ResponseEntity.ok(summary);
    }
}
