package pl.pamiec.backend.domain.tts;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class EdgeTtsGeneratorEngine implements TtsGeneratorEngine {

    private static final Logger log = LoggerFactory.getLogger(EdgeTtsGeneratorEngine.class);

    private final String sidecarUrl;
    private final String defaultVoice;

    public EdgeTtsGeneratorEngine(
            @Value("${tts.sidecar.url:http://localhost:8090/api/tts}") String sidecarUrl,
            @Value("${tts.edge.default-voice:en-US-AvaMultilingualNeural}") String defaultVoice) {

        this.sidecarUrl = sidecarUrl;
        this.defaultVoice = defaultVoice;
    }

    @Override
    public byte[] generateSpeech(String text) {
        if (text == null || text.isBlank()) {
            log.warn("Text for TTS is empty or null");
            return null;
        }

        log.info("Generating Edge-TTS audio speech using voice '{}' (text length: {})",
                defaultVoice, text.length());

        try {
            byte[] sidecarAudioBytes = synthesizeViaSidecar(text, defaultVoice);
            if (sidecarAudioBytes != null && sidecarAudioBytes.length > 0) {
                log.info("Successfully generated Edge-TTS Azure Neural audio via Python Sidecar (size: {} bytes)", sidecarAudioBytes.length);
                return sidecarAudioBytes;
            }
        } catch (Exception e) {
            log.error("Edge-TTS Python Sidecar request failed: {}", e.getMessage());
        }

        return null;
    }

    private byte[] synthesizeViaSidecar(String text, String voice) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        String jsonBody = String.format("{\"text\":%s,\"voice\":\"%s\"}",
                escapeJson(text), voice);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(sidecarUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() == 200 && response.body() != null && response.body().length > 0) {
            return response.body();
        } else {
            throw new RuntimeException("Sidecar returned status code " + response.statusCode());
        }
    }

    private String escapeJson(String text) {
        if (text == null) return "\"\"";
        return "\"" + text.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t") + "\"";
    }
}
