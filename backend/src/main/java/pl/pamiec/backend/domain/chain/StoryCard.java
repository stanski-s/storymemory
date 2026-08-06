package pl.pamiec.backend.domain.chain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "story_cards")
public class StoryCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chain_id", nullable = false)
    @JsonIgnore
    private MemoryChain chain;

    @Column(name = "sequence_index", nullable = false)
    private int sequenceIndex;

    @Column(name = "target_item", nullable = false)
    private String targetItem;

    @Column(name = "story_segment", nullable = false, columnDefinition = "TEXT")
    private String storySegment;

    @Column(name = "image_prompt", nullable = false, columnDefinition = "TEXT")
    private String imagePrompt;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "audio_url", columnDefinition = "TEXT")
    private String audioUrl;

    public StoryCard() {}

    public StoryCard(MemoryChain chain, int sequenceIndex, String targetItem, String storySegment, String imagePrompt) {
        this.chain = chain;
        this.sequenceIndex = sequenceIndex;
        this.targetItem = targetItem;
        this.storySegment = storySegment;
        this.imagePrompt = imagePrompt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public MemoryChain getChain() { return chain; }
    public void setChain(MemoryChain chain) { this.chain = chain; }

    public int getSequenceIndex() { return sequenceIndex; }
    public void setSequenceIndex(int sequenceIndex) { this.sequenceIndex = sequenceIndex; }

    public String getTargetItem() { return targetItem; }
    public void setTargetItem(String targetItem) { this.targetItem = targetItem; }

    public String getStorySegment() { return storySegment; }
    public void setStorySegment(String storySegment) { this.storySegment = storySegment; }

    public String getImagePrompt() { return imagePrompt; }
    public void setImagePrompt(String imagePrompt) { this.imagePrompt = imagePrompt; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
}
