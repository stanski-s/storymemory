package pl.pamiec.backend.domain.tts;

public interface TtsGeneratorEngine {

    /**
     * Synthesizes audio speech from text.
     *
     * @param text The card text narration to convert to speech.
     * @return Raw MP3 binary audio bytes.
     */
    byte[] generateSpeech(String text);
}
