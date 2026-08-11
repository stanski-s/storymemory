package pl.pamiec.backend.domain.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.pamiec.backend.domain.chain.MemoryChainRepository;
import pl.pamiec.backend.domain.recall.RecallSessionRepository;
import pl.pamiec.backend.domain.user.dto.UserStatsDto;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final MemoryChainRepository chainRepository;
    private final RecallSessionRepository recallSessionRepository;

    public UserController(MemoryChainRepository chainRepository, RecallSessionRepository recallSessionRepository) {
        this.chainRepository = chainRepository;
        this.recallSessionRepository = recallSessionRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsDto> getUserStats(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String userId = authentication.getName();
        long totalChains = chainRepository.countByUserId(userId);
        long totalRecallSessions = recallSessionRepository.countByUserId(userId);
        Double avgAccuracy = recallSessionRepository.findAverageAccuracyScoreByUserId(userId);
        long totalMemoryGaps = recallSessionRepository.countMemoryGapsByUserId(userId);

        double averageAccuracyScore = avgAccuracy != null ? Math.round(avgAccuracy * 100.0) / 100.0 : 0.0;

        return ResponseEntity.ok(new UserStatsDto(
                totalChains,
                totalRecallSessions,
                averageAccuracyScore,
                totalMemoryGaps
        ));
    }
}
