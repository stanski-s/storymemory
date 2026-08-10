package pl.pamiec.backend.domain.recall;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.pamiec.backend.domain.chain.MemoryChain;
import pl.pamiec.backend.domain.chain.MemoryChainRepository;
import pl.pamiec.backend.domain.chain.StoryCard;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RecallEvaluationService {

    private final MemoryChainRepository memoryChainRepository;
    private final RecallSessionRepository recallSessionRepository;
    private final MemoryGapRepository memoryGapRepository;

    public RecallEvaluationService(MemoryChainRepository memoryChainRepository,
                                   RecallSessionRepository recallSessionRepository,
                                   MemoryGapRepository memoryGapRepository) {
        this.memoryChainRepository = memoryChainRepository;
        this.recallSessionRepository = recallSessionRepository;
        this.memoryGapRepository = memoryGapRepository;
    }

    private double roundToTwoDecimals(double value) {
        return java.math.BigDecimal.valueOf(value)
                .setScale(2, java.math.RoundingMode.HALF_UP)
                .doubleValue();
    }

    @Transactional
    public RecallSessionResult evaluateAndSaveSession(UUID chainId, SubmitRecallRequest request) {
        MemoryChain chain = memoryChainRepository.findById(chainId)
                .orElseThrow(() -> new IllegalArgumentException("MemoryChain not found with id: " + chainId));

        List<StoryCard> cards = chain.getCards().stream()
                .sorted(Comparator.comparingInt(StoryCard::getSequenceIndex))
                .toList();

        Map<Integer, RecallAnswerItem> answerMap = request.responses() != null
                ? request.responses().stream().collect(Collectors.toMap(RecallAnswerItem::sequenceIndex, Function.identity(), (a, b) -> a))
                : Map.of();

        double totalEarnedPoints = 0.0;
        int correctCount = 0;
        List<MemoryGap> gapEntities = new ArrayList<>();
        List<MemoryGapDto> gapDtos = new ArrayList<>();

        RecallSession session = new RecallSession(chain, chain.getUserId(), 0.0, request.mode());

        for (StoryCard card : cards) {
            RecallAnswerItem answer = answerMap.get(card.getSequenceIndex());
            String userText = answer != null && answer.userText() != null ? answer.userText().trim() : "";
            boolean tier1Used = answer != null && answer.hintTier1Revealed();
            boolean tier2Used = answer != null && answer.hintTier2Revealed();

            boolean exactMatch = card.getTargetItem().trim().equalsIgnoreCase(userText);
            double points = 0.0;
            boolean isCorrect = false;

            if (exactMatch && !tier1Used && !tier2Used) {
                points = 1.0;
                isCorrect = true;
                correctCount++;
            } else if (exactMatch && tier1Used && !tier2Used) {
                points = 0.5;
                isCorrect = true;
                correctCount++;
            } else if (exactMatch) {
                points = 0.0;
                isCorrect = true;
                correctCount++;
            } else {
                points = 0.0;
                isCorrect = false;
            }

            totalEarnedPoints += points;

            if (!exactMatch || tier1Used || tier2Used) {
                MemoryGap gap = new MemoryGap(session, card, card.getSequenceIndex(), card.getTargetItem(), userText, tier1Used, tier2Used);
                session.addGap(gap);
                gapEntities.add(gap);
            }
        }

        double rawScore = cards.isEmpty() ? 0.0 : (totalEarnedPoints / cards.size()) * 100.0;
        double accuracyScore = roundToTwoDecimals(rawScore);
        session.setAccuracyScore(accuracyScore);

        RecallSession savedSession = recallSessionRepository.save(session);

        for (MemoryGap g : savedSession.getGaps()) {
            boolean exactMatch = g.getTargetItem().trim().equalsIgnoreCase(g.getUserSubmittedText() != null ? g.getUserSubmittedText().trim() : "");
            gapDtos.add(new MemoryGapDto(
                    g.getId(),
                    g.getSequenceIndex(),
                    g.getTargetItem(),
                    g.getUserSubmittedText(),
                    exactMatch,
                    g.isHintTier1Revealed(),
                    g.isHintTier2Revealed(),
                    g.getCard()
            ));
        }

        return new RecallSessionResult(
                savedSession.getId(),
                chainId,
                savedSession.getAccuracyScore(),
                cards.size(),
                correctCount,
                gapDtos.size(),
                savedSession.getMode(),
                gapDtos,
                savedSession.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public RecallSummaryResponse getChainRecallSummary(UUID chainId) {
        List<RecallSession> sessions = recallSessionRepository.findByChainIdOrderByCreatedAtDesc(chainId);
        if (sessions.isEmpty()) {
            return new RecallSummaryResponse(chainId, 0, null, null, null, null, List.of());
        }

        RecallSession latest = sessions.get(0);
        int totalSessions = sessions.size();
        double latestScore = latest.getAccuracyScore();
        java.math.BigDecimal totalSum = java.math.BigDecimal.ZERO;
        for (RecallSession s : sessions) {
            totalSum = totalSum.add(java.math.BigDecimal.valueOf(s.getAccuracyScore()));
        }
        double avgScore = totalSum.divide(java.math.BigDecimal.valueOf(totalSessions), 2, java.math.RoundingMode.HALF_UP).doubleValue();
        double bestScore = roundToTwoDecimals(sessions.stream().mapToDouble(RecallSession::getAccuracyScore).max().orElse(0.0));

        List<MemoryGapDto> latestGaps = latest.getGaps().stream()
                .map(g -> {
                    boolean exactMatch = g.getTargetItem().trim().equalsIgnoreCase(g.getUserSubmittedText() != null ? g.getUserSubmittedText().trim() : "");
                    return new MemoryGapDto(
                            g.getId(),
                            g.getSequenceIndex(),
                            g.getTargetItem(),
                            g.getUserSubmittedText(),
                            exactMatch,
                            g.isHintTier1Revealed(),
                            g.isHintTier2Revealed(),
                            g.getCard()
                    );
                }).toList();

        RecallSessionResult latestResult = new RecallSessionResult(
                latest.getId(),
                chainId,
                latest.getAccuracyScore(),
                latest.getChain().getCards().size(),
                latest.getChain().getCards().size() - latestGaps.size(),
                latestGaps.size(),
                latest.getMode(),
                latestGaps,
                latest.getCreatedAt()
        );

        return new RecallSummaryResponse(
                chainId,
                totalSessions,
                latestScore,
                avgScore,
                bestScore,
                latestResult,
                latestGaps
        );
    }
}
