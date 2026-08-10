package pl.pamiec.backend.domain.chain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import pl.pamiec.backend.domain.chain.dto.GeneratedCardSegment;
import pl.pamiec.backend.domain.chain.dto.GeneratedStoryChain;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GroqStoryGeneratorEngine implements StoryGeneratorEngine {

    private static final Logger log = LoggerFactory.getLogger(GroqStoryGeneratorEngine.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient;

    @Value("${groq.api-key:}")
    private String apiKey;

    @Value("${groq.base-url:https://api.groq.com/openai}")
    private String baseUrl;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String modelName;

    public GroqStoryGeneratorEngine(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    @Override
    public GeneratedStoryChain generateStory(String topic, String language, List<String> items) {
        log.info("Generating story chain for topic: '{}', language: '{}', items: {}", topic, language, items);

        String effectiveApiKey = apiKey;
        if (effectiveApiKey == null || effectiveApiKey.isBlank()) {
            log.warn("GROQ_API_KEY is not set. Falling back to mock generator.");
            return generateMockStoryChain(topic, language, items);
        }

        try {
            String systemPrompt = buildSystemPrompt(topic, language, items);
            String userPrompt = "Generate the memory chain for target items: " + String.join(", ", items);

            String endpointUrl = baseUrl.endsWith("/v1/chat/completions") ? baseUrl :
                (baseUrl.endsWith("/") ? baseUrl + "v1/chat/completions" : baseUrl + "/v1/chat/completions");

            Map<String, Object> requestBody = Map.of(
                "model", modelName,
                "temperature", 0.7,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
                )
            );

            log.info("Sending request to Groq Cloud API ({}) with model '{}'", endpointUrl, modelName);

            String rawJsonResponse = restClient.post()
                .uri(endpointUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + effectiveApiKey)
                .body(requestBody)
                .retrieve()
                .body(String.class);

            if (rawJsonResponse == null || rawJsonResponse.isBlank()) {
                log.warn("Empty response received from Groq Cloud API. Falling back to mock.");
                return generateMockStoryChain(topic, language, items);
            }

            JsonNode rootNode = objectMapper.readTree(rawJsonResponse);
            String contentText = rootNode.path("choices").path(0).path("message").path("content").asText();

            log.info("Raw response text from Groq LLM: {}", contentText);
            return parseJsonResponse(contentText, items);

        } catch (Exception e) {
            log.error("Failed to generate story using Groq Cloud AI: {}. Falling back to mock generator.", e.getMessage(), e);
            return generateMockStoryChain(topic, language, items);
        }
    }

    private String buildSystemPrompt(String topic, String language, List<String> items) {
        return """
            You are a master mnemonic storyteller creating absurd, vivid, and surreal memory chains.
            The user wants to memorize a list of items for the topic '%s' in %s.
            
            Rules:
            1. For each item in the list, create a story card segment linking it to the narrative.
            2. The narrative must be vivid, visual, absurd, and funny to reinforce memory retention.
            3. Target item MUST be highlighted in the story segment text.
            4. Provide an 'imagePrompt' for each card specifically optimized for AI Text-to-Image models (like FLUX / Stable Diffusion):
               a. MUST be written in ENGLISH.
               b. MUST explicitly feature the main subject/object ('targetItem' translated to English if target item is foreign) performing the exact visual action and setting from 'storySegment'.
               c. Focus purely on concrete, visible subjects, comic book style, bold outlines, vibrant colors, environment, and physical actions (e.g., "Vivid comic book illustration of a glowing neon dog wearing a giant red sombrero hat floating over a golden desert, graphic novel style").
               d. Do NOT use abstract metaphors or non-visual words like "concept", "symbolism", "memory gap", or "learning".
            
            Return ONLY valid JSON matching this exact structure:
            {
              "cards": [
                {
                  "sequenceIndex": 0,
                  "targetItem": "item_name",
                  "storySegment": "Surreal narrative sentence introducing targetItem...",
                  "imagePrompt": "Vibrant comic book illustration of [English subject] [exact action and environment], graphic novel style, bold outlines, surreal cartoon art"
                }
              ]
            }
            """.formatted(topic, language);
    }

    private GeneratedStoryChain parseJsonResponse(String rawResponse, List<String> items) {
        try {
            String jsonStr = rawResponse.trim();
            if (jsonStr.startsWith("```json")) {
                jsonStr = jsonStr.substring(7);
            }
            if (jsonStr.startsWith("```")) {
                jsonStr = jsonStr.substring(3);
            }
            if (jsonStr.endsWith("```")) {
                jsonStr = jsonStr.substring(0, jsonStr.length() - 3);
            }
            jsonStr = jsonStr.trim();

            return objectMapper.readValue(jsonStr, GeneratedStoryChain.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse JSON from Groq LLM response: {}", e.getMessage());
            return generateMockStoryChain("Memory Chain", "English", items);
        }
    }

    private GeneratedStoryChain generateMockStoryChain(String topic, String language, List<String> items) {
        List<GeneratedCardSegment> mockCards = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            String item = items.get(i);
            String story = "In a surreal world of " + topic + ", a glowing " + item + " suddenly floats in space, sparkling under neon lights.";
            String prompt = "Surreal digital art of a glowing neon " + item + " floating in deep cosmic space, 8k render.";
            mockCards.add(new GeneratedCardSegment(i, item, story, prompt));
        }
        return new GeneratedStoryChain(mockCards);
    }
}
