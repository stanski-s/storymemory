package pl.pamiec.backend.domain.chain;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pl.pamiec.backend.domain.chain.dto.CreateChainRequest;
import pl.pamiec.backend.domain.chain.dto.CreateChainResponse;
import pl.pamiec.backend.domain.chain.dto.StoryCardDto;

import java.util.UUID;

@RestController
@RequestMapping("/api/chains")
@CrossOrigin(origins = "*")
public class MemoryChainController {

    private final MemoryChainService chainService;

    public MemoryChainController(MemoryChainService chainService) {
        this.chainService = chainService;
    }

    @PostMapping
    public ResponseEntity<CreateChainResponse> createChain(@RequestBody CreateChainRequest request) {
        CreateChainResponse response = chainService.createChain(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemoryChainDto> getChain(@PathVariable("id") UUID id) {
        MemoryChainDto chainDto = chainService.getChain(id);
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
