package pl.pamiec.backend.chain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "memory_chains")
public class MemoryChain {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String topic;

    @Column(name = "target_language", nullable = false)
    private String targetLanguage;

    @Column(name = "raw_items", nullable = false, columnDefinition = "TEXT")
    private String rawItems;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChainStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "chain", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("sequenceIndex ASC")
    private List<StoryCard> cards = new ArrayList<>();

    public MemoryChain() {}

    public MemoryChain(String topic, String targetLanguage, String rawItems) {
        this.topic = topic;
        this.targetLanguage = targetLanguage;
        this.rawItems = rawItems;
        this.status = ChainStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getTargetLanguage() { return targetLanguage; }
    public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }

    public String getRawItems() { return rawItems; }
    public void setRawItems(String rawItems) { this.rawItems = rawItems; }

    public ChainStatus getStatus() { return status; }
    public void setStatus(ChainStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<StoryCard> getCards() { return cards; }
    public void setCards(List<StoryCard> cards) { this.cards = cards; }

    public void addCard(StoryCard card) {
        cards.add(card);
        card.setChain(this);
    }
}
