package pl.pamiec.backend.domain.recall;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import pl.pamiec.backend.domain.chain.MemoryChain;
import pl.pamiec.backend.domain.chain.MemoryChainRepository;
import pl.pamiec.backend.domain.chain.StoryCard;

import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class RecallControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private MemoryChainRepository memoryChainRepository;

    @Autowired
    private RecallSessionRepository recallSessionRepository;

    @Autowired
    private MemoryGapRepository memoryGapRepository;

    private MemoryChain chain;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        memoryGapRepository.deleteAll();
        recallSessionRepository.deleteAll();
        memoryChainRepository.deleteAll();

        chain = new MemoryChain("00000000-0000-0000-0000-000000000000", "Fruits", "apple, banana");
        StoryCard card1 = new StoryCard(chain, 0, "apple", "An apple falls from a tree.", "An apple.");
        card1.setImageUrl("http://localhost/apple.png");
        card1.setAudioUrl("http://localhost/apple.mp3");

        StoryCard card2 = new StoryCard(chain, 1, "banana", "A banana wears a suit.", "A banana.");
        card2.setImageUrl("http://localhost/banana.png");
        card2.setAudioUrl("http://localhost/banana.mp3");

        chain.addCard(card1);
        chain.addCard(card2);
        chain = memoryChainRepository.save(chain);
    }

    @Test
    @WithMockUser(username = "00000000-0000-0000-0000-000000000000")
    @DisplayName("POST /api/chains/{chainId}/recall should evaluate session and return result")
    void shouldEvaluateSessionAndReturnResult() throws Exception {
        String jsonPayload = """
                {
                  "mode": "STEP_BY_STEP",
                  "responses": [
                    { "sequenceIndex": 0, "userText": "apple", "hintTier1Revealed": false, "hintTier2Revealed": false },
                    { "sequenceIndex": 1, "userText": "banana", "hintTier1Revealed": true, "hintTier2Revealed": false }
                  ]
                }
                """;

        mockMvc.perform(post("/api/chains/" + chain.getId() + "/recall")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chainId", is(chain.getId().toString())))
                .andExpect(jsonPath("$.accuracyScore", is(75.0)))
                .andExpect(jsonPath("$.totalItems", is(2)))
                .andExpect(jsonPath("$.correctCount", is(2)))
                .andExpect(jsonPath("$.gapCount", is(1)))
                .andExpect(jsonPath("$.gaps[0].targetItem", is("banana")));
    }

    @Test
    @WithMockUser(username = "00000000-0000-0000-0000-000000000000")
    @DisplayName("GET /api/chains/{chainId}/recall/summary should return aggregated recall stats")
    void shouldReturnAggregatedRecallStats() throws Exception {
        String jsonPayload = """
                {
                  "mode": "FULL_FORM",
                  "responses": [
                    { "sequenceIndex": 0, "userText": "apple", "hintTier1Revealed": false, "hintTier2Revealed": false },
                    { "sequenceIndex": 1, "userText": "banana", "hintTier1Revealed": false, "hintTier2Revealed": false }
                  ]
                }
                """;

        mockMvc.perform(post("/api/chains/" + chain.getId() + "/recall")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/chains/" + chain.getId() + "/recall/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chainId", is(chain.getId().toString())))
                .andExpect(jsonPath("$.totalSessions", is(1)))
                .andExpect(jsonPath("$.latestAccuracyScore", is(100.0)))
                .andExpect(jsonPath("$.bestAccuracyScore", is(100.0)));
    }
}
