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
    @DisplayName("Should generate non-empty audio when sidecar is available")
    void shouldGenerateAudioFromLiveSidecar() {
        byte[] audio = ttsEngine.generateSpeech("In a surreal world of memory, a glowing dog dances under neon lights.");

        org.junit.jupiter.api.Assumptions.assumeTrue(audio != null, "TTS sidecar is not running locally; skipping live integration test");
        assertThat(audio.length).isGreaterThan(1000);
    }

}
