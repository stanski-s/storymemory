package pl.pamiec.backend.domain.chain.image;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class CloudflareWorkersAiImageModelTest {

    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer mockServer;
    private CloudflareWorkersAiImageModel model;

    @BeforeEach
    void setUp() {
        restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();

        model = new CloudflareWorkersAiImageModel(
            restClientBuilder,
            "test_acc_123",
            "test_token_456",
            "@cf/black-forest-labs/flux-1-schnell",
            4,
            768,
            768
        );
    }

    @Test
    void shouldGenerateImageWithBase64JsonResponse() {
        byte[] rawImageBytes = new byte[]{10, 20, 30, 40};
        String base64Image = Base64.getEncoder().encodeToString(rawImageBytes);
        String jsonResponse = String.format("{\"success\":true,\"result\":{\"image\":\"%s\"}}", base64Image);

        mockServer.expect(requestTo("https://api.cloudflare.com/client/v4/accounts/test_acc_123/ai/run/@cf/black-forest-labs/flux-1-schnell"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("Authorization", "Bearer test_token_456"))
            .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        byte[] resultBytes = model.generateImage("surreal dog on hat");

        mockServer.verify();
        assertThat(resultBytes).isEqualTo(rawImageBytes);
    }

    @Test
    void shouldGenerateImageWithBinaryStreamResponse() {
        byte[] binaryImageBytes = new byte[]{1, 2, 3, 4, 5};

        mockServer.expect(requestTo("https://api.cloudflare.com/client/v4/accounts/test_acc_123/ai/run/@cf/black-forest-labs/flux-1-schnell"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("Authorization", "Bearer test_token_456"))
            .andRespond(withSuccess(binaryImageBytes, MediaType.IMAGE_PNG));

        byte[] resultBytes = model.generateImage("surreal dog on hat");

        mockServer.verify();
        assertThat(resultBytes).isEqualTo(binaryImageBytes);
    }

    @Test
    void shouldReturnEmptyByteArrayWhenUnconfigured() {
        CloudflareWorkersAiImageModel unconfiguredModel = new CloudflareWorkersAiImageModel(
            restClientBuilder,
            "",
            "",
            "@cf/black-forest-labs/flux-1-schnell",
            4,
            768,
            768
        );

        byte[] resultBytes = unconfiguredModel.generateImage("some prompt");
        assertThat(resultBytes).isEmpty();
    }

    @Test
    void shouldReturnEmptyByteArrayOnBlankPrompt() {
        byte[] resultBytes = model.generateImage("   ");
        assertThat(resultBytes).isEmpty();
    }

    @Test
    void shouldRetryWithSanitizedPromptOnNsfwError() {
        byte[] binaryImageBytes = new byte[]{9, 8, 7, 6};
        String nsfwErrorBody = "{\"errors\":[{\"message\":\"AiError: AiError: Input prompt contains NSFW content.\",\"code\":3030}],\"success\":false}";

        // 1st attempt fails with 400 Bad Request (NSFW)
        mockServer.expect(requestTo("https://api.cloudflare.com/client/v4/accounts/test_acc_123/ai/run/@cf/black-forest-labs/flux-1-schnell"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withBadRequest().body(nsfwErrorBody).contentType(MediaType.APPLICATION_JSON));

        // 2nd attempt (retry with sanitized prompt) succeeds
        mockServer.expect(requestTo("https://api.cloudflare.com/client/v4/accounts/test_acc_123/ai/run/@cf/black-forest-labs/flux-1-schnell"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess(binaryImageBytes, MediaType.IMAGE_PNG));

        byte[] resultBytes = model.generateImage("some risky NSFW prompt");

        mockServer.verify();
        assertThat(resultBytes).isEqualTo(binaryImageBytes);
    }
}
