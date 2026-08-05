package pl.pamiec.backend.chain;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pl.pamiec.backend.chain.dto.CreateChainRequest;
import pl.pamiec.backend.chain.dto.CreateChainResponse;
import pl.pamiec.backend.chain.dto.MemoryChainDto;

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
        if (request.items() == null || request.items().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        CreateChainResponse response = chainService.createChain(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping(value = "/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChainProgress(@PathVariable UUID id) {
        return chainService.subscribeToStream(id);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemoryChainDto> getChain(@PathVariable UUID id) {
        try {
            MemoryChainDto dto = chainService.getChain(id);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
