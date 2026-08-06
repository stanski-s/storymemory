package pl.pamiec.backend.domain.chain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pl.pamiec.backend.domain.chain.dto.GeneratedCardSegment;
import pl.pamiec.backend.domain.chain.dto.GeneratedStoryChain;

import java.util.ArrayList;
import java.util.List;

@Service
public class GroqStoryGeneratorEngine implements StoryGeneratorEngine {

    private static final Logger log = LoggerFactory.getLogger(GroqStoryGeneratorEngine.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api-key:}")
    private String apiKey;

    @Value("${groq.base-url:https://api.groq.com/openai}")
    private String baseUrl;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String modelName;

    @Override
    public GeneratedStoryChain generateStory(String topic, String language, List<String> items) {
        log.info("Generating story chain for topic: '{}', language: '{}', items: {}", topic, language, items);

        String effectiveApiKey = apiKey;
        if (effectiveApiKey == null || effectiveApiKey.isBlank()) {
            log.warn("GROQ_API_KEY is not set. Falling back to mock generator.");
            return generateMockStoryChain(topic, language, items);
        }

        try {
            OpenAiApi openAiApi = OpenAiApi.builder()
                .baseUrl(baseUrl)
                .apiKey(effectiveApiKey)
                .build();

            ChatModel chatModel = OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(OpenAiChatOptions.builder()
                    .model(modelName)
                    .temperature(0.7)
                    .build())
                .build();

            String systemPrompt = buildSystemPrompt(topic, language, items);
            String userPrompt = "Generate the memory chain for target items: " + String.join(", ", items);

            Prompt prompt = new Prompt(List.of(
                new org.springframework.ai.chat.messages.SystemMessage(systemPrompt),
                new org.springframework.ai.chat.messages.UserMessage(userPrompt)
            ));

            String responseText = chatModel.call(prompt).getResult().getOutput().getText();
            log.info("Raw response from Groq LLM: {}", responseText);

            return parseJsonResponse(responseText, items);

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
            4. Provide a detailed, surreal visual prompt for an AI Text-to-Image model for each scene.
            
            Return ONLY valid JSON matching this exact structure:
            {
              "cards": [
                {
                  "sequenceIndex": 0,
                  "targetItem": "item_name",
                  "storySegment": "Surreal narrative sentence introducing targetItem...",
                  "imagePrompt": "Detailed surreal illustration description for Text-to-Image model..."
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
