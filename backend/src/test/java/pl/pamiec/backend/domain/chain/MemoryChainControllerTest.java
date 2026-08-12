package pl.pamiec.backend.domain.chain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import pl.pamiec.backend.domain.chain.dto.GeneratedCardSegment;
import pl.pamiec.backend.domain.chain.dto.GeneratedStoryChain;
import pl.pamiec.backend.domain.chain.image.ImageGeneratorEngine;
import pl.pamiec.backend.domain.tts.TtsGeneratorEngine;
import pl.pamiec.backend.storage.ObjectStorageService;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class MemoryChainControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private MemoryChainRepository chainRepository;

    @MockitoBean
    private StoryGeneratorEngine storyGeneratorEngine;

    @MockitoBean
    private ImageGeneratorEngine imageGeneratorEngine;

    @MockitoBean
    private TtsGeneratorEngine ttsGeneratorEngine;

    @MockitoBean
    private ObjectStorageService objectStorageService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        chainRepository.deleteAll();

        GeneratedStoryChain mockChain = new GeneratedStoryChain(List.of(
                new GeneratedCardSegment(0, "dog", "A glowing neon dog dances on top of a giant sombrero.",
                        "Surreal digital art of a glowing neon dog dancing on a giant hat"),
                new GeneratedCardSegment(1, "cat", "Suddenly a floating space cat shoots lasers at the sombrero.",
                        "Surreal art of a galactic cosmic cat shooting lasers in deep space")));

        when(storyGeneratorEngine.generateStory(anyString(), any())).thenReturn(mockChain);
        when(imageGeneratorEngine.generateImage(anyString())).thenReturn(new byte[] { 1, 2, 3 });
        when(ttsGeneratorEngine.generateSpeech(anyString())).thenReturn(new byte[] { 1, 2, 3 });
        when(objectStorageService.uploadImage(any(), any(), anyString()))
                .thenReturn("http://localhost:9000/pamiec-media/images/test.png");
        when(objectStorageService.uploadAudio(any(), any(), anyString()))
                .thenReturn("http://localhost:9000/pamiec-media/audio/test.mp3");
    }

    @Test
    @WithMockUser(username = "00000000-0000-0000-0000-000000000001")
    void shouldCreateChainAndPersistToPostgres() throws Exception {
        String jsonPayload = """
                {
                    "topic": "Animals",
                    "items": ["dog", "cat"]
                }
                """;

        MvcResult result = mockMvc.perform(post("/api/chains")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.status").value("GENERATING"))
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        String idStr = responseStr.substring(responseStr.indexOf("\"id\":\"") + 6,
                responseStr.indexOf("\",\"status\""));
        UUID chainId = UUID.fromString(idStr);

        MemoryChain chain = null;
        for (int i = 0; i < 50; i++) {
            Thread.sleep(200);
            chain = chainRepository.findById(chainId).orElseThrow();
            if (chain.getStatus() == ChainStatus.COMPLETED || chain.getStatus() == ChainStatus.FAILED) {
                break;
            }
        }

        assertThat(chain).isNotNull();
        assertThat(chain.getStatus()).isEqualTo(ChainStatus.COMPLETED);
        assertThat(chain.getCards()).hasSize(2);
        assertThat(chain.getCards().get(0).getTargetItem()).isEqualTo("dog");
        assertThat(chain.getCards().get(0).getImageUrl())
                .isEqualTo("http://localhost:9000/pamiec-media/images/test.png");
        assertThat(chain.getCards().get(1).getTargetItem()).isEqualTo("cat");
    }

    @Test
    void shouldSubscribeToSseStream() throws Exception {
        // Use zero-UUID so controller's ownership check passes (public/legacy chain)
        MemoryChain chain = new MemoryChain("Animals", "dog,cat");
        chain.setStatus(ChainStatus.COMPLETED);
        chain = chainRepository.save(chain);

        StoryCard card1 = new StoryCard(chain, 0, "dog", "Neon dog on sombrero", "Surreal neon dog prompt");
        card1.setImageUrl("http://localhost:9000/pamiec-media/images/1.png");
        StoryCard card2 = new StoryCard(chain, 1, "cat", "Cosmic cat with lasers", "Surreal cosmic cat prompt");
        card2.setImageUrl("http://localhost:9000/pamiec-media/images/2.png");
        chain.addCard(card1);
        chain.addCard(card2);
        chainRepository.save(chain);

        // SSE stream endpoint does not require authentication in SecurityConfig
        MvcResult result = mockMvc.perform(get("/api/chains/" + chain.getId() + "/stream")
                .accept(MediaType.TEXT_EVENT_STREAM_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String sseOutput = result.getResponse().getContentAsString();
        assertThat(sseOutput).contains("event:CHAIN_CREATED");
        assertThat(sseOutput).contains("event:CARD_GENERATED");
        assertThat(sseOutput).contains("event:CARD_IMAGE_GENERATED");
        assertThat(sseOutput).contains("dog");
        assertThat(sseOutput).contains("cat");
        assertThat(sseOutput).contains("event:CHAIN_COMPLETED");
    }
}
