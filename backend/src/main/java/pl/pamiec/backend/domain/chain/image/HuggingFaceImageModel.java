package pl.pamiec.backend.domain.chain.image;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.image.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Component
public class HuggingFaceImageModel implements ImageModel, ImageGeneratorEngine {

    private static final Logger log = LoggerFactory.getLogger(HuggingFaceImageModel.class);
    private static final String PROMPT_PREFIX = "Surrealist, vivid, vibrant, hyper-detailed illustration of ";

    private final RestClient restClient;
    private final String apiKey;
    private final String baseUrl;
    private final String model;

    public HuggingFaceImageModel(
            RestClient.Builder restClientBuilder,
            @Value("${huggingface.api-key:}") String apiKey,
            @Value("${huggingface.base-url:https://router.huggingface.co/hf-inference}") String baseUrl,
            @Value("${huggingface.model:black-forest-labs/FLUX.1-schnell}") String model) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.model = model;
        this.restClient = restClientBuilder.build();
    }

    @Override
    public ImageResponse call(ImagePrompt imagePrompt) {
        String instructions = imagePrompt.getInstructions().getFirst().getText();
        byte[] imageBytes = generateImage(instructions);
        if (imageBytes.length == 0) {
            return new ImageResponse(List.of());
        }
        String b64Image = Base64.getEncoder().encodeToString(imageBytes);
        Image image = new Image(null, b64Image);
        return new ImageResponse(List.of(new ImageGeneration(image)));
    }

    @Override
    public byte[] generateImage(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            log.warn("Empty prompt provided for Hugging Face image generation.");
            return new byte[0];
        }

        String enhancedPrompt = prompt.startsWith("Surrealist") ? prompt : PROMPT_PREFIX + prompt.trim();
        String endpointUrl = baseUrl + "/models/" + model;

        log.info("Sending Text-to-Image request via Spring AI ImageModel to Hugging Face model '{}'", model);

        try {
            RestClient.RequestBodySpec requestSpec = restClient.post()
                .uri(endpointUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("inputs", enhancedPrompt));

            if (apiKey != null && !apiKey.isBlank()) {
                requestSpec.header("Authorization", "Bearer " + apiKey);
            }

            byte[] responseBytes = requestSpec.retrieve().body(byte[].class);

            if (responseBytes != null && responseBytes.length > 0) {
                log.info("Successfully received {} bytes image from Hugging Face API", responseBytes.length);
                return responseBytes;
            } else {
                log.warn("Empty response body returned from Hugging Face API");
                return new byte[0];
            }
        } catch (Exception e) {
            log.error("Failed to generate image via Hugging Face API: {}", e.getMessage(), e);
            return new byte[0];
        }
    }
}
