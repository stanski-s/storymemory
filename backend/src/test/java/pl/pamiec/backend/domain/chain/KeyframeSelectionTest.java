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
    @DisplayName("Medium chain (7 items) should pick 1st card and every 2nd card (step=2, max 5)")
    void mediumChainKeyframes() {
        int totalCards = 7;
        // Expected keyframes for 7 items (step=2): 0, 2, 4, 6 (4 keyframes total)
        assertThat(MemoryChainService.isKeyframe(0, totalCards)).isTrue();
        assertThat(MemoryChainService.isKeyframe(1, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(2, totalCards)).isTrue();
        assertThat(MemoryChainService.isKeyframe(3, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(4, totalCards)).isTrue();
        assertThat(MemoryChainService.isKeyframe(5, totalCards)).isFalse();
        assertThat(MemoryChainService.isKeyframe(6, totalCards)).isTrue();
    }

    @Test
    @DisplayName("Long chain (12 items) should pick 1st card and every 3rd card (step=3, max 5)")
    void longChainKeyframes() {
        int totalCards = 12;
        // Expected keyframes for 12 items (step=3): 0, 3, 6, 9 (4 keyframes total)
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
        assertThat(MemoryChainService.isKeyframe(11, totalCards)).isFalse();
    }

    @ParameterizedTest
    @ValueSource(ints = {6, 7, 8, 9, 10, 11, 12, 15, 20, 30, 50})
    @DisplayName("For any chain length > 5, card 0 is keyframe and total keyframes never exceeds 5")
    void maxFiveKeyframesEnforced(int totalCards) {
        // Card 0 must always be keyframe
        assertThat(MemoryChainService.isKeyframe(0, totalCards))
                .as("1st card (index 0) must always be keyframe")
                .isTrue();

        int keyframeCount = 0;
        for (int i = 0; i < totalCards; i++) {
            if (MemoryChainService.isKeyframe(i, totalCards)) {
                keyframeCount++;
            }
        }

        assertThat(keyframeCount)
                .as("Total keyframes for chain of size %d should be <= 5", totalCards)
                .isGreaterThan(0)
                .isLessThanOrEqualTo(5);
    }
}
