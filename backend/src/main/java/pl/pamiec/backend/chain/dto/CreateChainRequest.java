package pl.pamiec.backend.chain.dto;

import java.util.List;

public record CreateChainRequest(
    String userId,
    String topic,
    String language,
    String targetLanguage,
    List<String> items
) {
    public String getEffectiveLanguage() {
        if (language != null && !language.isBlank()) {
            return language;
        }
        if (targetLanguage != null && !targetLanguage.isBlank()) {
            return targetLanguage;
        }
        return "English";
    }
}

