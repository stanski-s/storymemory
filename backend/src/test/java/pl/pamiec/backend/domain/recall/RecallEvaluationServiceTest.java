package pl.pamiec.backend.domain.recall;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import pl.pamiec.backend.domain.chain.MemoryChain;
import pl.pamiec.backend.domain.chain.MemoryChainRepository;
import pl.pamiec.backend.domain.chain.StoryCard;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RecallEvaluationServiceTest {

    @Autowired
    private MemoryChainRepository memoryChainRepository;

    @Autowired
    private RecallSessionRepository recallSessionRepository;

    @Autowired
    private MemoryGapRepository memoryGapRepository;

    @Autowired
    private RecallEvaluationService recallEvaluationService;

    private MemoryChain chain;

    @BeforeEach
    void setUp() {
        memoryGapRepository.deleteAll();
        recallSessionRepository.deleteAll();
        memoryChainRepository.deleteAll();

        chain = new MemoryChain("00000000-0000-0000-0000-000000000000", "Spanish Words", "el perro, el gato, el pájaro");
        StoryCard card1 = new StoryCard(chain, 0, "el perro", "Un perro baila en la calle.", "A dog dancing on the street.");
        card1.setImageUrl("http://localhost/image1.png");
        card1.setAudioUrl("http://localhost/audio1.mp3");

        StoryCard card2 = new StoryCard(chain, 1, "el gato", "Un gato toca la guitarra.", "A cat playing guitar.");
        card2.setImageUrl("http://localhost/image2.png");
        card2.setAudioUrl("http://localhost/audio2.mp3");

        StoryCard card3 = new StoryCard(chain, 2, "el pájaro", "Un pájaro vuela con sombreros.", "A bird flying with hats.");
        card3.setImageUrl("http://localhost/image3.png");
        card3.setAudioUrl("http://localhost/audio3.mp3");

        chain.addCard(card1);
        chain.addCard(card2);
        chain.addCard(card3);

        chain = memoryChainRepository.save(chain);
    }

    @Test
    @DisplayName("Should evaluate active recall session using strict match and weighted score formula")
    void shouldEvaluateActiveRecallSessionWithWeightedScore() {
        // Item 0 ("el perro"): correct, 0 hints -> 100%
        // Item 1 ("el gato"): correct, Tier 1 (image) hint used -> 50%
        // Item 2 ("el pájaro"): wrong ("el pajarito"), Tier 2 (audio) hint used -> 0%
        // Weighted Score: (100 + 50 + 0) / 3 = 50.0%

        SubmitRecallRequest request = new SubmitRecallRequest(
                "STEP_BY_STEP",
                List.of(
                        new RecallAnswerItem(0, "EL PERRO", false, false),
                        new RecallAnswerItem(1, "el gato", true, false),
                        new RecallAnswerItem(2, "el pajarito", true, true)
                )
        );

        RecallSessionResult result = recallEvaluationService.evaluateAndSaveSession(chain.getId(), request);

        assertThat(result.sessionId()).isNotNull();
        assertThat(result.chainId()).isEqualTo(chain.getId());
        assertThat(result.accuracyScore()).isEqualTo(50.0);
        assertThat(result.totalItems()).isEqualTo(3);
        assertThat(result.correctCount()).isEqualTo(2);
        assertThat(result.gapCount()).isEqualTo(2); // Item 1 (due to hint) & Item 2 (due to wrong answer)

        List<RecallSession> savedSessions = recallSessionRepository.findByChainIdOrderByCreatedAtDesc(chain.getId());
        assertThat(savedSessions).hasSize(1);
        assertThat(savedSessions.get(0).getAccuracyScore()).isEqualTo(50.0);

        List<MemoryGap> savedGaps = memoryGapRepository.findBySessionId(result.sessionId());
        assertThat(savedGaps).hasSize(2);
    }

    @Test
    @DisplayName("Should compute aggregated recall summary with latest session and overall stats")
    void shouldComputeAggregatedRecallSummary() {
        SubmitRecallRequest req1 = new SubmitRecallRequest("STEP_BY_STEP", List.of(
                new RecallAnswerItem(0, "el perro", false, false),
                new RecallAnswerItem(1, "wrong", false, false),
                new RecallAnswerItem(2, "wrong", false, false)
        ));
        recallEvaluationService.evaluateAndSaveSession(chain.getId(), req1);

        SubmitRecallRequest req2 = new SubmitRecallRequest("FULL_FORM", List.of(
                new RecallAnswerItem(0, "el perro", false, false),
                new RecallAnswerItem(1, "el gato", false, false),
                new RecallAnswerItem(2, "el pájaro", false, false)
        ));
        recallEvaluationService.evaluateAndSaveSession(chain.getId(), req2);

        RecallSummaryResponse summary = recallEvaluationService.getChainRecallSummary(chain.getId());

        assertThat(summary.totalSessions()).isEqualTo(2);
        assertThat(summary.latestAccuracyScore()).isEqualTo(100.0);
        assertThat(summary.averageAccuracyScore()).isEqualTo(66.67);
        assertThat(summary.bestAccuracyScore()).isEqualTo(100.0);
        assertThat(summary.latestSessionGaps()).isEmpty();
    }

    @Test
    @DisplayName("Should evaluate session submitted in CLOZE_STORY mode")
    void shouldEvaluateRecallSessionInClozeStoryMode() {
        SubmitRecallRequest req = new SubmitRecallRequest("CLOZE_STORY", List.of(
                new RecallAnswerItem(0, "el perro", false, false),
                new RecallAnswerItem(1, "el gato", false, false),
                new RecallAnswerItem(2, "el pájaro", false, false)
        ));

        RecallSessionResult result = recallEvaluationService.evaluateAndSaveSession(chain.getId(), req);

        assertThat(result.mode()).isEqualTo("CLOZE_STORY");
        assertThat(result.accuracyScore()).isEqualTo(100.0);
        assertThat(result.gapCount()).isEqualTo(0);
    }
}
