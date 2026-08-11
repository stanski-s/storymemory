package pl.pamiec.backend.domain.chain;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pl.pamiec.backend.domain.chain.dto.CreateChainRequest;
import pl.pamiec.backend.domain.chain.dto.CreateChainResponse;
import pl.pamiec.backend.domain.chain.dto.MemoryChainDto;
import pl.pamiec.backend.domain.chain.dto.StoryCardDto;


import org.springframework.security.core.Authentication;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chains")
@CrossOrigin(origins = "*")
public class MemoryChainController {

    private final MemoryChainService chainService;
    private final MemoryChainRepository chainRepository;

    public MemoryChainController(MemoryChainService chainService, MemoryChainRepository chainRepository) {
        this.chainService = chainService;
        this.chainRepository = chainRepository;
    }

    @GetMapping
    public ResponseEntity<List<MemoryChainDto>> getUserChains(Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : "00000000-0000-0000-0000-000000000000";
        List<MemoryChainDto> chains = chainRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(MemoryChainDto::fromEntity)
                .toList();
        return ResponseEntity.ok(chains);
    }

    @PostMapping
    public ResponseEntity<CreateChainResponse> createChain(@RequestBody CreateChainRequest request, Authentication authentication) {
        String userId = (authentication != null && authentication.getName() != null)
                ? authentication.getName()
                : request.userId();
        CreateChainRequest userRequest = new CreateChainRequest(userId, request.topic(), request.items());
        CreateChainResponse response = chainService.createChain(userRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemoryChainDto> getChain(@PathVariable("id") UUID id, Authentication authentication) {
        MemoryChainDto chainDto = chainService.getChain(id);
        if (authentication != null && authentication.getName() != null) {
            String currentUserId = authentication.getName();
            if (chainDto.userId() != null && !chainDto.userId().equals("00000000-0000-0000-0000-000000000000") && !chainDto.userId().equalsIgnoreCase(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        return ResponseEntity.ok(chainDto);
    }

    @GetMapping(value = "/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToStream(@PathVariable("id") UUID id) {
        return chainService.subscribeToStream(id);
    }

    @PostMapping("/{id}/cards/{cardId}/generate-image")
    public ResponseEntity<StoryCardDto> generateCardImage(
            @PathVariable("id") UUID chainId,
            @PathVariable("cardId") UUID cardId) {
        StoryCardDto updatedCard = chainService.generateCardImageOnDemand(chainId, cardId);
        return ResponseEntity.ok(updatedCard);
    }
}
