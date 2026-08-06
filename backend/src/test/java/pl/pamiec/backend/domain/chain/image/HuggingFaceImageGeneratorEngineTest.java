package pl.pamiec.backend.domain.chain.image;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class HuggingFaceImageGeneratorEngineTest {

    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer mockServer;
    private HuggingFaceImageModel model;

    @BeforeEach
    void setUp() {
        restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();

        model = new HuggingFaceImageModel(
            restClientBuilder,
            "hf_dummy_token",
            "https://router.huggingface.co/hf-inference",
            "black-forest-labs/FLUX.1-schnell"
        );
    }

    @Test
    void shouldGenerateImageWithEnhancedPromptAndHeaders() {
        byte[] expectedImageBytes = new byte[]{1, 2, 3, 4, 5};

        mockServer.expect(requestTo("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("Authorization", "Bearer hf_dummy_token"))
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.inputs").value("Surrealist, vivid, vibrant, hyper-detailed illustration of glowing neon dog on sombrero"))
            .andRespond(withSuccess(expectedImageBytes, MediaType.IMAGE_PNG));

        byte[] resultBytes = model.generateImage("glowing neon dog on sombrero");

        mockServer.verify();
        assertThat(resultBytes).isEqualTo(expectedImageBytes);
    }

    @Test
    void shouldReturnEmptyByteArrayOnApiError() {
        mockServer.expect(requestTo("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withServerError());

        byte[] resultBytes = model.generateImage("glowing neon dog on sombrero");

        mockServer.verify();
        assertThat(resultBytes).isEmpty();
    }
}
