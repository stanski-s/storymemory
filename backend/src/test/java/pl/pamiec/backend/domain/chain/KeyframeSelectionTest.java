package pl.pamiec.backend.domain.chain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class KeyframeSelectionTest {

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5})
    @DisplayName("Short chains (<= 5 items) should make all cards keyframes")
    void shortChainsHaveAllKeyframes(int totalCards) {
        for (int i = 0; i < totalCards; i++) {
            assertThat(MemoryChainService.isKeyframe(i, totalCards))
                .as("Card index %d in chain of %d should be keyframe", i, totalCards)
                .isTrue();
        }
    }

    @Test
    @DisplayName("Medium chain (7 items) should pick every 2nd card plus last card")
    void mediumChainKeyframes() {
        int totalCards = 7;
        // Expected keyframes for 7 items (step=2): 0, 2, 4, 6 (6 is also last)
        assertThat(MemoryChainService.isKeyframe(0, totalCards)).isTrue();
        assertThat(MemoryChainService.isKeyframe(1, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(2, totalCards)).isTrue();
        assertThat(MemoryChainService.isKeyframe(3, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(4, totalCards)).isTrue();
        assertThat(MemoryChainService.isKeyframe(5, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(6, totalCards)).isTrue();
    }

    @Test
    @DisplayName("Long chain (12 items) should pick every 3rd card plus last card")
    void longChainKeyframes() {
        int totalCards = 12;
        // Expected keyframes for 12 items (step=3): 0, 3, 6, 9, 11 (11 is last)
        assertThat(MemoryChainService.isKeyframe(0, totalCards)).isTrue();
        assertThat(MemoryChainService.isKeyframe(1, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(2, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(3, totalCards)).isTrue();
        assertThat(MemoryChainService.isKeyframe(4, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(5, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(6, totalCards)).isTrue();
        assertThat(MemoryChainService.isKeyframe(7, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(8, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(9, totalCards)).isTrue();
        assertThat(MemoryChainService.isKeyframe(10, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(11, totalCards)).isTrue(); // last card
    }
}
