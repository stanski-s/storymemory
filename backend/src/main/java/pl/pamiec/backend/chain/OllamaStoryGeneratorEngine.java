package pl.pamiec.backend.chain;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;
import pl.pamiec.backend.chain.dto.GeneratedStoryChain;

import java.util.List;

@Component
public class OllamaStoryGeneratorEngine implements StoryGeneratorEngine {

    private final ChatClient chatClient;

    public OllamaStoryGeneratorEngine(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @Override
    public GeneratedStoryChain generateStory(String topic, String targetLanguage, List<String> items) {
        String promptText = String.format(
                "Topic: %s\nTarget Language: %s\nItems to learn in exact sequence: %s\n" +
                        "Generate a surreal, absurd, sensory-rich story connecting these items in sequential order.",
                topic, targetLanguage, String.join(", ", items));

        return chatClient.prompt()
                .system("You are a surreal memory chain generator(Story/link Method). " +
                        "Construct an absurd, action-packed narrative sequence connecting target items. " +
                        "Each card must contain: sequenceIndex (0-based integer), targetItem, storySegment, and a detailed imagePrompt for surreal visual rendering.")
                .user(promptText)
                .call()
                .entity(GeneratedStoryChain.class);
    }
}
