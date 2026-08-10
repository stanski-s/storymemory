package pl.pamiec.backend.domain.tts;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EdgeTtsGeneratorEngineTest {

    private EdgeTtsGeneratorEngine ttsEngine;

    @BeforeEach
    void setUp() {
        ttsEngine = new EdgeTtsGeneratorEngine("http://localhost:8090/api/tts", "en-US-AvaMultilingualNeural");
    }

    @Test
    @DisplayName("Should return null for blank text")
    void shouldReturnNullForBlankText() {
        byte[] audio = ttsEngine.generateSpeech("");

        assertThat(audio).isNull();
    }

    @Test
    @DisplayName("Should return null when sidecar is unreachable")
    void shouldReturnNullWhenSidecarIsUnreachable() {
        byte[] audio = ttsEngine.generateSpeech("Narration test in London.");

        // Sidecar at localhost:8090 is not running during unit tests, should return null without throwing
        assertThat(audio).isNull();
    }

}
