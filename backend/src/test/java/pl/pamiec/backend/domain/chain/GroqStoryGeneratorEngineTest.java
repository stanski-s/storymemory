package pl.pamiec.backend.domain.chain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import pl.pamiec.backend.domain.chain.dto.GeneratedStoryChain;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GroqStoryGeneratorEngineTest {

    @Test
    @DisplayName("When API key is missing, fallback to mock story chain")
    void fallbackToMockWhenApiKeyMissing() {
        RestClient.Builder builder = RestClient.builder();
        GroqStoryGeneratorEngine engine = new GroqStoryGeneratorEngine(builder);

        GeneratedStoryChain chain = engine.generateStory("Planets", List.of("Mercury", "Venus", "Earth"));

        assertThat(chain).isNotNull();
        assertThat(chain.cards()).hasSize(3);
        assertThat(chain.cards().get(0).targetItem()).isEqualTo("Mercury");
        assertThat(chain.cards().get(1).targetItem()).isEqualTo("Venus");
        assertThat(chain.cards().get(2).targetItem()).isEqualTo("Earth");
    }
}
