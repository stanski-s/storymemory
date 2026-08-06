package pl.pamiec.backend.chain;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import pl.pamiec.backend.chain.dto.GeneratedCardSegment;
import pl.pamiec.backend.chain.dto.GeneratedStoryChain;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class GroqStoryGeneratorEngine implements StoryGeneratorEngine {

    private static final Logger log = LoggerFactory.getLogger(GroqStoryGeneratorEngine.class);

    @Value("${groq.api-key:}")
    private String apiKey;

    @Value("${groq.base-url:https://api.groq.com/openai}")
    private String baseUrl;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String modelName;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper;

    public GroqStoryGeneratorEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    private String getEffectiveApiKey() {
        if (apiKey != null && !apiKey.isBlank()) {
            return apiKey.trim();
        }
        String sysEnv = System.getenv("GROQ_API_KEY");
        if (sysEnv != null && !sysEnv.isBlank()) {
            return sysEnv.trim();
        }
        // Direct .env file reader fallback
        try {
            List<Path> candidatePaths = List.of(
                    Paths.get(".env"),
                    Paths.get("backend/.env"),
                    Paths.get("../.env"));
            for (Path p : candidatePaths) {
                if (Files.exists(p)) {
                    List<String> lines = Files.readAllLines(p);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.startsWith("GROQ_API_KEY=")) {
                            String val = line.substring("GROQ_API_KEY=".length()).trim();
                            val = val.replaceAll("^[\"']|[\"']$", "");
                            if (!val.isBlank()) {
                                return val;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to read .env file directly: {}", e.getMessage());
        }
        return "";
    }

    @Override
    public GeneratedStoryChain generateStory(String topic, String targetLanguage, List<String> items) {
        String effectiveKey = getEffectiveApiKey();

        String promptText = String.format(
                """
                        Topic: %s
                        Target Language: %s
                        Items to connect: %s

                        Construct an absurd, surreal mnemonic story connecting these items in exact sequential order(story/link method for memory training).
                        Return ONLY a valid JSON object matching this schema without any markdown wrapping or codeblocks:
                        {
                          "cards": [
                            {
                              "sequenceIndex": 0,
                              "targetItem": "word1",
                              "storySegment": "surreal story segment text",
                              "imagePrompt": "visual description for image generation"
                            }
                          ]
                        }
                        """,
                topic, targetLanguage, String.join(", ", items));

        if (!effectiveKey.isBlank()) {
            try {
                String endpoint = baseUrl.endsWith("/v1") ? baseUrl + "/chat/completions"
                        : baseUrl + "/v1/chat/completions";
                Map<String, Object> requestPayload = Map.of(
                        "model", modelName,
                        "messages", List.of(
                                Map.of("role", "system", "content",
                                        "You are a surreal memory chain generator. Output strictly valid JSON without codeblocks or extra text."),
                                Map.of("role", "user", "content", promptText)),
                        "temperature", 0.7);

                log.info("Sending request to Groq Cloud API model {}...", modelName);

                String responseBody = restClient.post()
                        .uri(endpoint)
                        .header("Authorization", "Bearer " + effectiveKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestPayload)
                        .retrieve()
                        .body(String.class);

                if (responseBody != null) {
                    JsonNode rootNode = objectMapper.readTree(responseBody);
                    String content = rootNode.path("choices").get(0).path("message").path("content").asText();
                    if (content != null && !content.isBlank()) {
                        String cleanedJson = content.trim();
                        if (cleanedJson.startsWith("```")) {
                            cleanedJson = cleanedJson.replaceAll("^```json|^```|```$", "").trim();
                        }
                        log.info("Successfully received surreal story from Groq AI!");
                        return objectMapper.readValue(cleanedJson, GeneratedStoryChain.class);
                    }
                }
            } catch (Exception e) {
                log.warn("Groq API request failed: {}. Falling back to default mnemonic generator.", e.getMessage());
            }
        } else {
            log.info("GROQ_API_KEY is not set in environment or .env. Using fallback mnemonic generator.");
        }

        // Fallback: Generate structured fallback story cards if key is missing or call
        // fails
        List<GeneratedCardSegment> fallbackCards = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            String item = items.get(i);
            fallbackCards.add(new GeneratedCardSegment(
                    i,
                    item,
                    "A surreal glowing scene featuring " + item + " interacting magically in " + targetLanguage
                            + " context.",
                    "Surreal digital art illustration of " + item + " in a cosmic dreamscape"));
        }
        return new GeneratedStoryChain(fallbackCards);
    }
}
