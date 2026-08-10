package pl.pamiec.backend.domain.chain;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pl.pamiec.backend.domain.chain.dto.*;
import pl.pamiec.backend.domain.chain.image.ImageGeneratorEngine;
import pl.pamiec.backend.domain.tts.TtsGeneratorEngine;
import pl.pamiec.backend.storage.ObjectStorageService;

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
    private final ImageGeneratorEngine imageGeneratorEngine;
    private final TtsGeneratorEngine ttsGeneratorEngine;
    private final ObjectStorageService objectStorageService;
    private final Map<UUID, List<SseEmitter>> emittersMap = new ConcurrentHashMap<>();

    public MemoryChainService(MemoryChainRepository chainRepository,
                               StoryCardRepository cardRepository,
                               StoryGeneratorEngine storyGeneratorEngine,
                               ImageGeneratorEngine imageGeneratorEngine,
                               TtsGeneratorEngine ttsGeneratorEngine,
                               ObjectStorageService objectStorageService) {
        this.chainRepository = chainRepository;
        this.cardRepository = cardRepository;
        this.storyGeneratorEngine = storyGeneratorEngine;
        this.imageGeneratorEngine = imageGeneratorEngine;
        this.ttsGeneratorEngine = ttsGeneratorEngine;
        this.objectStorageService = objectStorageService;
    }

    public CreateChainResponse createChain(CreateChainRequest request) {
        String rawItemsStr = String.join(",", request.items());
        MemoryChain chain = new MemoryChain(request.userId(), request.topic(), rawItemsStr);
        chain.setStatus(ChainStatus.GENERATING);
        MemoryChain savedChain = chainRepository.save(chain);

        // Async Virtual Thread processing for AI generation & streaming
        Thread.ofVirtual().start(() -> processChainGeneration(savedChain.getId(), request));

        return new CreateChainResponse(savedChain.getId(), savedChain.getStatus().name());
    }

    public SseEmitter subscribeToStream(UUID chainId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        if (chainId == null) {
            return emitter;
        }
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
                    "totalItems", Arrays.asList(chain.getRawItems().split(",")).size(),
                    "status", chain.getStatus().name()
                );
                emitter.send(SseEmitter.event().name("CHAIN_CREATED").data(createdData, MediaType.APPLICATION_JSON));

                for (StoryCard card : chain.getCards()) {
                    Map<String, Object> cardData = buildCardEventData(chain.getId(), card);
                    emitter.send(SseEmitter.event().name("CARD_GENERATED").data(cardData, MediaType.APPLICATION_JSON));
                    if (card.getImageUrl() != null && !card.getImageUrl().isBlank()) {
                        emitter.send(SseEmitter.event().name("CARD_IMAGE_GENERATED").data(cardData, MediaType.APPLICATION_JSON));
                    }
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

        return new MemoryChainDto(chain.getId(), chain.getUserId(), chain.getTopic(), rawItemsList, chain.getStatus(), chain.getCreatedAt(), cardDtos);
    }

    private void processChainGeneration(UUID chainId, CreateChainRequest request) {
        try {
            emitEvent(chainId, "CHAIN_CREATED", Map.of(
                "chainId", chainId,
                "topic", request.topic(),
                "totalItems", request.items().size(),
                "status", "GENERATING"
            ));

            GeneratedStoryChain generatedChain = storyGeneratorEngine.generateStory(
                request.topic(), request.items()
            );

            MemoryChain chain = chainRepository.findById(chainId).orElseThrow();
            List<StoryCard> createdCards = new ArrayList<>();

            if (generatedChain != null && generatedChain.cards() != null) {
                // Phase 1: Save cards and IMMEDIATELY emit CARD_GENERATED events for instant text UI rendering
                for (GeneratedCardSegment seg : generatedChain.cards()) {
                    StoryCard card = new StoryCard(chain, seg.sequenceIndex(), seg.targetItem(), seg.storySegment(), seg.imagePrompt());
                    StoryCard savedCard = cardRepository.save(card);
                    chain.addCard(savedCard);
                    createdCards.add(savedCard);

                    Map<String, Object> cardData = buildCardEventData(chainId, savedCard);
                    emitEvent(chainId, "CARD_GENERATED", cardData);
                }

                // Phase 2: Generate content sequentially
                Thread heartbeatThread = Thread.ofVirtual().start(() -> {
                    while (!Thread.currentThread().isInterrupted()) {
                        try {
                            Thread.sleep(3000);
                            emitEvent(chainId, "PING", Map.of("chainId", chainId, "timestamp", System.currentTimeMillis()));
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            break;
                        } catch (Exception ignored) {}
                    }
                });

                try {
                    int totalCardsCount = createdCards.size();
                    for (StoryCard card : createdCards) {
                        // Image generation
                        if (isKeyframe(card.getSequenceIndex(), totalCardsCount)) {
                            try {
                                byte[] imageBytes = imageGeneratorEngine.generateImage(card.getImagePrompt());
                                if (imageBytes != null && imageBytes.length > 0) {
                                    String imageUrl = objectStorageService.uploadImage(card.getId(), imageBytes, "image/png");
                                    if (imageUrl != null && !imageUrl.isBlank()) {
                                        card.setImageUrl(imageUrl);
                                        cardRepository.save(card);
                                        emitEvent(chainId, "CARD_IMAGE_GENERATED", buildCardEventData(chainId, card));
                                    }
                                }
                            } catch (Exception e) {
                                log.error("Failed image generation for card {}: {}", card.getId(), e.getMessage());
                            }
                        }
                        
                        // Audio generation
                        try {
                            byte[] audioBytes = ttsGeneratorEngine.generateSpeech(card.getStorySegment());
                            if (audioBytes != null && audioBytes.length > 0) {
                                String audioUrl = objectStorageService.uploadAudio(card.getId(), audioBytes, "audio/mpeg");
                                if (audioUrl != null && !audioUrl.isBlank()) {
                                    card.setAudioUrl(audioUrl);
                                    cardRepository.save(card);
                                    emitEvent(chainId, "CARD_AUDIO_GENERATED", buildCardEventData(chainId, card));
                                } else {
                                    emitAudioFailedEvent(chainId, card);
                                }
                            } else {
                                emitAudioFailedEvent(chainId, card);
                            }
                        } catch (Exception e) {
                            log.error("Failed audio generation for card {}: {}", card.getId(), e.getMessage());
                            emitAudioFailedEvent(chainId, card);
                        }

                    }
                } finally {
                    heartbeatThread.interrupt();
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

    private Map<String, Object> buildCardEventData(UUID chainId, StoryCard card) {
        Map<String, Object> cardData = new HashMap<>();
        cardData.put("chainId", chainId);
        cardData.put("cardId", card.getId());
        cardData.put("sequenceIndex", card.getSequenceIndex());
        cardData.put("targetItem", card.getTargetItem());
        cardData.put("storySegment", card.getStorySegment());
        cardData.put("imagePrompt", card.getImagePrompt());
        if (card.getImageUrl() != null) {
            cardData.put("imageUrl", card.getImageUrl());
        }
        if (card.getAudioUrl() != null) {
            cardData.put("audioUrl", card.getAudioUrl());
        }
        return cardData;
    }

    private void emitAudioFailedEvent(UUID chainId, StoryCard card) {
        Map<String, Object> data = new HashMap<>();
        data.put("chainId", chainId);
        data.put("cardId", card.getId());
        data.put("sequenceIndex", card.getSequenceIndex());
        data.put("message", "Failed to generate audio narration for the story");
        emitEvent(chainId, "CARD_AUDIO_FAILED", data);
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

    public static boolean isKeyframe(int cardIndex, int totalCards) {
        if (totalCards <= 5) {
            return true;
        }
        if (cardIndex == 0 || cardIndex == totalCards - 1) {
            return true;
        }
        if (totalCards <= 10) {
            return cardIndex % 2 == 0;
        }
        return cardIndex % 3 == 0;
    }

    public StoryCardDto generateCardImageOnDemand(UUID chainId, UUID cardId) {
        StoryCard card = cardRepository.findById(cardId)
            .orElseThrow(() -> new IllegalArgumentException("StoryCard not found with ID: " + cardId));

        if (!card.getChain().getId().equals(chainId)) {
            throw new IllegalArgumentException("Card ID " + cardId + " does not belong to chain " + chainId);
        }

        byte[] imageBytes = imageGeneratorEngine.generateImage(card.getImagePrompt());
        if (imageBytes != null && imageBytes.length > 0) {
            String imageUrl = objectStorageService.uploadImage(card.getId(), imageBytes, "image/png");
            if (imageUrl != null && !imageUrl.isBlank()) {
                card.setImageUrl(imageUrl);
                cardRepository.save(card);

                Map<String, Object> cardImageData = buildCardEventData(chainId, card);
                emitEvent(chainId, "CARD_IMAGE_GENERATED", cardImageData);
                log.info("On-demand generated image for card index {} (ID: {})", card.getSequenceIndex(), card.getId());
            }
        }

        return new StoryCardDto(card.getId(), card.getSequenceIndex(), card.getTargetItem(), card.getStorySegment(), card.getImagePrompt(), card.getImageUrl(), card.getAudioUrl());
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
