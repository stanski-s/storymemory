package pl.pamiec.backend.chain;

import pl.pamiec.backend.chain.dto.GeneratedStoryChain;
import java.util.List;

public interface StoryGeneratorEngine {
    GeneratedStoryChain generateStory(String topic, String targetLanguage, List<String> items);
}
