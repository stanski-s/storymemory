package pl.pamiec.backend.domain.tts;

public interface TtsGeneratorEngine {

    /**
     * Synthesizes audio speech from text for the given language.
     *
     * @param text     The card text narration to convert to speech.
     * @param language The target language (e.g. "Polish", "English", "pl", "en").
     * @return Raw MP3 binary audio bytes.
     */
    byte[] generateSpeech(String text, String language);
}
