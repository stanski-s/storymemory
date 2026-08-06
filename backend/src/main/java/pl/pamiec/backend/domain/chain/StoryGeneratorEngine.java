package pl.pamiec.backend.domain.chain;

import pl.pamiec.backend.domain.chain.dto.GeneratedStoryChain;
import java.util.List;

public interface StoryGeneratorEngine {
    GeneratedStoryChain generateStory(String topic, String language, List<String> items);
}
