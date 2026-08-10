package pl.pamiec.backend.domain.recall;

import jakarta.persistence.*;
import pl.pamiec.backend.domain.chain.StoryCard;

import java.util.UUID;

@Entity
@Table(name = "memory_gaps")
public class MemoryGap {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private RecallSession session;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "card_id", nullable = false)
    private StoryCard card;

    @Column(name = "sequence_index", nullable = false)
    private int sequenceIndex;

    @Column(name = "target_item", nullable = false)
    private String targetItem;

    @Column(name = "user_submitted_text")
    private String userSubmittedText;

    @Column(name = "hint_tier1_revealed", nullable = false)
    private boolean hintTier1Revealed;

    @Column(name = "hint_tier2_revealed", nullable = false)
    private boolean hintTier2Revealed;

    public MemoryGap() {}

    public MemoryGap(RecallSession session, StoryCard card, int sequenceIndex, String targetItem,
                     String userSubmittedText, boolean hintTier1Revealed, boolean hintTier2Revealed) {
        this.session = session;
        this.card = card;
        this.sequenceIndex = sequenceIndex;
        this.targetItem = targetItem;
        this.userSubmittedText = userSubmittedText;
        this.hintTier1Revealed = hintTier1Revealed;
        this.hintTier2Revealed = hintTier2Revealed;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public RecallSession getSession() { return session; }
    public void setSession(RecallSession session) { this.session = session; }

    public StoryCard getCard() { return card; }
    public void setCard(StoryCard card) { this.card = card; }

    public int getSequenceIndex() { return sequenceIndex; }
    public void setSequenceIndex(int sequenceIndex) { this.sequenceIndex = sequenceIndex; }

    public String getTargetItem() { return targetItem; }
    public void setTargetItem(String targetItem) { this.targetItem = targetItem; }

    public String getUserSubmittedText() { return userSubmittedText; }
    public void setUserSubmittedText(String userSubmittedText) { this.userSubmittedText = userSubmittedText; }

    public boolean isHintTier1Revealed() { return hintTier1Revealed; }
    public void setHintTier1Revealed(boolean hintTier1Revealed) { this.hintTier1Revealed = hintTier1Revealed; }

    public boolean isHintTier2Revealed() { return hintTier2Revealed; }
    public void setHintTier2Revealed(boolean hintTier2Revealed) { this.hintTier2Revealed = hintTier2Revealed; }
}
