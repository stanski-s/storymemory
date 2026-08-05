package pl.pamiec.backend.chain;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import pl.pamiec.backend.chain.dto.*;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class MemoryChainService {

    private static final Logger log = LoggerFactory.getLogger(MemoryChainService.class);
    private static final Long SSE_TIMEOUT = 600_000L; // 10 minutes

    private final MemoryChainRepository chainRepository;
    private final StoryCardRepository cardRepository;
    private final StoryGeneratorEngine storyGeneratorEngine;
    private final Map<UUID, List<SseEmitter>> emittersMap = new ConcurrentHashMap<>();

    public MemoryChainService(MemoryChainRepository chainRepository,
                               StoryCardRepository cardRepository,
                               StoryGeneratorEngine storyGeneratorEngine) {
        this.chainRepository = chainRepository;
        this.cardRepository = cardRepository;
        this.storyGeneratorEngine = storyGeneratorEngine;
    }

    public CreateChainResponse createChain(CreateChainRequest request) {
        String rawItemsStr = String.join(",", request.items());
        MemoryChain chain = new MemoryChain(request.topic(), request.targetLanguage(), rawItemsStr);
        chain.setStatus(ChainStatus.GENERATING);
        MemoryChain savedChain = chainRepository.save(chain);

        // Async Virtual Thread processing for AI generation & streaming
        Thread.ofVirtual().start(() -> processChainGeneration(savedChain.getId(), request));

        return new CreateChainResponse(savedChain.getId(), savedChain.getStatus().name());
    }

    public SseEmitter subscribeToStream(UUID chainId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        List<SseEmitter> emitters = emittersMap.computeIfAbsent(chainId, k -> new CopyOnWriteArrayList<>());
        emitters.add(emitter);

        emitter.onCompletion(() -> removeEmitter(chainId, emitter));
        emitter.onTimeout(() -> removeEmitter(chainId, emitter));
        emitter.onError(e -> removeEmitter(chainId, emitter));

        // Replay current state if chain already exists
        chainRepository.findById(chainId).ifPresent(chain -> {
            try {
                Map<String, Object> createdData = Map.of(
                    "chainId", chain.getId(),
                    "topic", chain.getTopic(),
                    "targetLanguage", chain.getTargetLanguage(),
                    "totalItems", Arrays.asList(chain.getRawItems().split(",")).size(),
                    "status", chain.getStatus().name()
                );
                emitter.send(SseEmitter.event().name("CHAIN_CREATED").data(createdData, MediaType.APPLICATION_JSON));

                for (StoryCard card : chain.getCards()) {
                    Map<String, Object> cardData = Map.of(
                        "chainId", chain.getId(),
                        "cardId", card.getId(),
                        "sequenceIndex", card.getSequenceIndex(),
                        "targetItem", card.getTargetItem(),
                        "storySegment", card.getStorySegment(),
                        "imagePrompt", card.getImagePrompt()
                    );
                    emitter.send(SseEmitter.event().name("CARD_GENERATED").data(cardData, MediaType.APPLICATION_JSON));
                }

                if (chain.getStatus() == ChainStatus.COMPLETED) {
                    Map<String, Object> completedData = Map.of(
                        "chainId", chain.getId(),
                        "totalCards", chain.getCards().size(),
                        "status", "COMPLETED"
                    );
                    emitter.send(SseEmitter.event().name("CHAIN_COMPLETED").data(completedData, MediaType.APPLICATION_JSON));
                    emitter.complete();
                }
            } catch (IOException e) {
                log.warn("Failed replay event to SSE emitter for chain {}: {}", chainId, e.getMessage());
                removeEmitter(chainId, emitter);
            }
        });

        return emitter;
    }

    public MemoryChainDto getChain(UUID chainId) {
        MemoryChain chain = chainRepository.findById(chainId)
            .orElseThrow(() -> new IllegalArgumentException("MemoryChain not found with ID: " + chainId));

        List<String> rawItemsList = Arrays.asList(chain.getRawItems().split(","));
        List<StoryCardDto> cardDtos = chain.getCards().stream()
            .map(c -> new StoryCardDto(c.getId(), c.getSequenceIndex(), c.getTargetItem(), c.getStorySegment(), c.getImagePrompt(), c.getImageUrl(), c.getAudioUrl()))
            .toList();

        return new MemoryChainDto(chain.getId(), chain.getTopic(), chain.getTargetLanguage(), rawItemsList, chain.getStatus(), chain.getCreatedAt(), cardDtos);
    }

    private void processChainGeneration(UUID chainId, CreateChainRequest request) {
        try {
            emitEvent(chainId, "CHAIN_CREATED", Map.of(
                "chainId", chainId,
                "topic", request.topic(),
                "targetLanguage", request.targetLanguage(),
                "totalItems", request.items().size(),
                "status", "GENERATING"
            ));

            GeneratedStoryChain generatedChain = storyGeneratorEngine.generateStory(
                request.topic(), request.targetLanguage(), request.items()
            );

            MemoryChain chain = chainRepository.findById(chainId).orElseThrow();
            List<StoryCard> createdCards = new ArrayList<>();

            if (generatedChain != null && generatedChain.cards() != null) {
                for (GeneratedCardSegment seg : generatedChain.cards()) {
                    StoryCard card = new StoryCard(chain, seg.sequenceIndex(), seg.targetItem(), seg.storySegment(), seg.imagePrompt());
                    StoryCard savedCard = cardRepository.save(card);
                    createdCards.add(savedCard);

                    emitEvent(chainId, "CARD_GENERATED", Map.of(
                        "chainId", chainId,
                        "cardId", savedCard.getId(),
                        "sequenceIndex", savedCard.getSequenceIndex(),
                        "targetItem", savedCard.getTargetItem(),
                        "storySegment", savedCard.getStorySegment(),
                        "imagePrompt", savedCard.getImagePrompt()
                    ));
                }
            }

            chain.setStatus(ChainStatus.COMPLETED);
            chainRepository.save(chain);

            emitEvent(chainId, "CHAIN_COMPLETED", Map.of(
                "chainId", chainId,
                "totalCards", createdCards.size(),
                "status", "COMPLETED"
            ));

            completeEmitters(chainId);

        } catch (Exception e) {
            log.error("Error generating memory chain for ID {}: {}", chainId, e.getMessage(), e);
            chainRepository.findById(chainId).ifPresent(c -> {
                c.setStatus(ChainStatus.FAILED);
                chainRepository.save(c);
            });
            emitEvent(chainId, "ERROR", Map.of("chainId", chainId, "message", e.getMessage()));
            completeEmitters(chainId);
        }
    }

    private void emitEvent(UUID chainId, String eventName, Object data) {
        List<SseEmitter> emitters = emittersMap.get(chainId);
        if (emitters == null || emitters.isEmpty()) return;

        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data, MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }
        emitters.removeAll(deadEmitters);
    }

    private void completeEmitters(UUID chainId) {
        List<SseEmitter> emitters = emittersMap.remove(chainId);
        if (emitters != null) {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.complete();
                } catch (Exception ignored) {}
            }
        }
    }

    private void removeEmitter(UUID chainId, SseEmitter emitter) {
        List<SseEmitter> emitters = emittersMap.get(chainId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                emittersMap.remove(chainId);
            }
        }
    }
}
