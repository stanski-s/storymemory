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
    public GeneratedStoryChain generateStory(String topic, List<String> items) {
        log.info("Generating story chain for topic: '{}', items: {}", topic, items);

        String effectiveApiKey = apiKey;
        if (effectiveApiKey == null || effectiveApiKey.isBlank()) {
            log.warn("GROQ_API_KEY is not set. Falling back to mock generator.");
            return generateMockStoryChain(topic, items);
        }

        try {
            String systemPrompt = buildSystemPrompt(topic, items);
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
                return generateMockStoryChain(topic, items);
            }

            JsonNode rootNode = objectMapper.readTree(rawJsonResponse);
            String contentText = rootNode.path("choices").path(0).path("message").path("content").asText();

            log.info("Raw response text from Groq LLM: {}", contentText);
            return parseJsonResponse(contentText, items);

        } catch (Exception e) {
            log.error("Failed to generate story using Groq Cloud AI: {}. Falling back to mock generator.", e.getMessage(), e);
            return generateMockStoryChain(topic, items);
        }
    }

    private String buildSystemPrompt(String topic, List<String> items) {
        return """
            You are a master mnemonic storyteller creating absurd, vivid, and surreal sequential memory chains (Memory Palace / Link Method).
            The user wants to memorize a sequence of items in strict order for the topic '%s'.
            
            Rules:
            1. LINKING METHOD STRUCTURE (Strict Sequential Coupling & No Forward Leakage):
               - Card 0 (for the 1st item): Introduce ONLY the 1st item in a vivid, absurd, visual setting. STRICTLY DO NOT introduce or mention any future items (2nd item, 3rd item, etc.) in Card 0!
               - Card i (for item i, where i > 0): Create a vivid interaction linking ONLY item[i-1] (the previous item) with item[i] (the current targetItem). STRICTLY DO NOT introduce or mention any future items (item[i+1], item[i+2], etc.) ahead of their turn!
            2. SINGLE SENTENCE STRUCTURE (CRITICAL):
               - Each 'storySegment' MUST be EXACTLY ONE single sentence.
               - The sentence MUST be rich, detailed, vivid, absurd, and visual, approximately 15 to 25 words long.
               - STRICTLY AVOID ultra-short 3-5 word sentences or fragments! Paint a complete, memorable scene in that single sentence.
               - Do NOT use multiple sentences or background setup paragraphs. Keep it strictly to one single, rich, descriptive sentence.
            3. The narrative MUST be in English, vivid, visual, absurd, and funny to reinforce sequential memory retention.
            4. The target item MUST be explicitly mentioned in the story segment text.
            5. Provide an 'imagePrompt' for each card specifically optimized for AI Text-to-Image models (like FLUX / Stable Diffusion):
               a. MUST be written in ENGLISH.
               b. MUST explicitly feature the main subject/object ('targetItem') performing the exact visual action and setting from 'storySegment'.
               c. Focus purely on concrete, visible subjects, comic book style, bold outlines, vibrant colors, environment, and physical actions (e.g., "Vivid comic book illustration of a glowing neon dog wearing a giant red sombrero hat floating over a golden desert, graphic novel style").
               d. Do NOT use abstract metaphors or non-visual words like "concept", "symbolism", "memory gap", or "learning".
               e. MUST be strictly family-friendly, G-rated, safe for work (NSFW-free), and avoid any suggestive, violent, explicit, or sensitive words.
            
            Return ONLY valid JSON matching this exact structure:
            {
              "cards": [
                {
                  "sequenceIndex": 0,
                  "targetItem": "item_name",
                  "storySegment": "Vivid, detailed, and surreal single sentence introducing targetItem (1 sentence, 15-25 words).",
                  "imagePrompt": "Vibrant comic book illustration of [targetItem] [exact action and environment], graphic novel style, bold outlines, surreal cartoon art"
                }
              ]
            }
            """.formatted(topic);
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
            return generateMockStoryChain("Memory Chain", items);
        }
    }

    private GeneratedStoryChain generateMockStoryChain(String topic, List<String> items) {
        List<GeneratedCardSegment> mockCards = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            String item = items.get(i);
            String story;
            String prompt;
            if (i == 0) {
                story = "In a surreal world of " + topic + ", a glowing " + item + " suddenly appears, floating majestically under vibrant neon lights while emitting colorful sparks.";
                prompt = "Surreal digital art of a glowing neon " + item + " floating in deep cosmic space, 8k render.";
            } else {
                String prevItem = items.get(i - 1);
                story = "Suddenly, the " + prevItem + " collides violently with a giant " + item + ", causing a spectacular explosion of bright colorful confetti and dazzling fireworks across the sky.";
                prompt = "Surreal digital art of a " + prevItem + " colliding with a giant " + item + " in space with colorful confetti explosion, comic book style.";
            }
            mockCards.add(new GeneratedCardSegment(i, item, story, prompt));
        }
        return new GeneratedStoryChain(mockCards);
    }
}
