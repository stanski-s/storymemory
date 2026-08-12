package pl.pamiec.backend.domain.chain.image;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Base64;
import java.util.Map;

@Service
public class CloudflareWorkersAiImageModel implements ImageGeneratorEngine {

    private static final Logger log = LoggerFactory.getLogger(CloudflareWorkersAiImageModel.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${cloudflare.account-id:${CLOUDFLARE_ACCOUNT_ID:}}")
    private String accountId;

    @Value("${cloudflare.api-token:${CLOUDFLARE_API_TOKEN:}}")
    private String apiToken;

    @Value("${cloudflare.image-model:${CLOUDFLARE_IMAGE_MODEL:@cf/black-forest-labs/flux-1-schnell}}")
    private String imageModel;

    @Value("${cloudflare.num-steps:${CLOUDFLARE_NUM_STEPS:4}}")
    private int numSteps;

    @Value("${cloudflare.width:${CLOUDFLARE_WIDTH:768}}")
    private int width;

    @Value("${cloudflare.height:${CLOUDFLARE_HEIGHT:768}}")
    private int height;

    @Value("${cloudflare.guidance:${CLOUDFLARE_GUIDANCE:1.0}}")
    private double guidance;

    @Autowired
    public CloudflareWorkersAiImageModel(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    // Constructor for testing / programmatic configuration
    public CloudflareWorkersAiImageModel(RestClient.Builder restClientBuilder,
                                       String accountId,
                                       String apiToken,
                                       String imageModel,
                                       int numSteps,
                                       int width,
                                       int height) {
        this(restClientBuilder, accountId, apiToken, imageModel, numSteps, width, height, 1.0);
    }

    public CloudflareWorkersAiImageModel(RestClient.Builder restClientBuilder,
                                       String accountId,
                                       String apiToken,
                                       String imageModel,
                                       int numSteps,
                                       int width,
                                       int height,
                                       double guidance) {
        this.restClient = restClientBuilder.build();
        this.accountId = accountId;
        this.apiToken = apiToken;
        this.imageModel = imageModel;
        this.numSteps = numSteps;
        this.width = width;
        this.height = height;
        this.guidance = guidance;
    }

    @Override
    public byte[] generateImage(String prompt) {
        return executeGenerateImage(prompt, true);
    }

    private byte[] executeGenerateImage(String prompt, boolean allowRetry) {
        if (prompt == null || prompt.isBlank()) {
            log.warn("Empty prompt provided for Cloudflare Workers AI image generation.");
            return new byte[0];
        }

        if (accountId == null || accountId.isBlank() || apiToken == null || apiToken.isBlank()) {
            log.warn("Cloudflare Workers AI Account ID or API Token is not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env");
            return new byte[0];
        }

        try {
            log.info("Generating image via Cloudflare Workers AI model '{}' (steps={}, guidance={})...", imageModel, numSteps, guidance);
            String url = String.format("https://api.cloudflare.com/client/v4/accounts/%s/ai/run/%s",
                    accountId.trim(), imageModel.trim());

            Map<String, Object> requestBody = Map.of(
                "prompt", prompt.trim(),
                "num_steps", numSteps,
                "width", width,
                "height", height,
                "guidance", guidance
            );

            byte[] responseBytes = restClient.post()
                .uri(url)
                .header("Authorization", "Bearer " + apiToken.trim())
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(byte[].class);

            if (responseBytes != null && responseBytes.length > 0) {
                // If JSON response (starts with '{' -> ASCII 123)
                if (responseBytes[0] == '{') {
                    String responseStr = new String(responseBytes);
                    JsonNode root = objectMapper.readTree(responseStr);

                    if (root.has("success") && !root.path("success").asBoolean(true)) {
                        log.error("Cloudflare Workers AI returned error response: {}", responseStr);
                        return new byte[0];
                    }

                    JsonNode resultNode = root.path("result");
                    if (resultNode.has("image")) {
                        String base64Image = resultNode.path("image").asText();
                        if (!base64Image.isBlank()) {
                            log.info("Successfully generated image via Cloudflare Workers AI (Base64 decoded)!");
                            return Base64.getDecoder().decode(base64Image);
                        }
                    }
                } else {
                    // Direct binary image response (e.g. image/png or image/jpeg)
                    log.info("Successfully generated {} bytes image directly via Cloudflare Workers AI!", responseBytes.length);
                    return responseBytes;
                }
            }
        } catch (RestClientResponseException e) {
            String errorBody = e.getResponseBodyAsString();
            if (allowRetry && errorBody != null && (errorBody.contains("NSFW") || errorBody.contains("3030"))) {
                String sanitizedPrompt = buildSanitizedPrompt(prompt);
                log.warn("Cloudflare Workers AI rejected prompt due to NSFW safety filter. Retrying with sanitized prompt: '{}'", sanitizedPrompt);
                return executeGenerateImage(sanitizedPrompt, false);
            }
            log.error("Cloudflare Workers AI HTTP error status {}: {}", e.getStatusCode(), errorBody);
        } catch (Exception e) {
            log.error("Failed to generate image via Cloudflare Workers AI: {}", e.getMessage(), e);
        }

        return new byte[0];
    }

    private String buildSanitizedPrompt(String originalPrompt) {
        String safePrompt = originalPrompt.replaceAll("(?i)\\b(nsfw|naked|nude|sexy|adult|blood|kill|death|weapon|strip|cock|breast|violence|sex)\\b", "")
                .replaceAll("\\s+", " ")
                .trim();
        return safePrompt + ", wholesome family-friendly cartoon, comic book style, bright vibrant colors";
    }

    public String getAccountId() { return accountId; }
    public String getApiToken() { return apiToken; }
    public String getImageModel() { return imageModel; }
}
