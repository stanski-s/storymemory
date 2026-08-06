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

    @Column(name = "user_id")
    private String userId;

    @Column(nullable = false)
    private String topic;

    @Column(name = "language", nullable = false)
    private String language;

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

    public MemoryChain(String userId, String topic, String language, String rawItems) {
        this.userId = (userId != null && !userId.isBlank()) ? userId : "guest";
        this.topic = topic;
        this.language = language;
        this.rawItems = rawItems;
        this.status = ChainStatus.PENDING;
        this.createdAt = Instant.now();
    }


    public MemoryChain(String topic, String language, String rawItems) {
        this(null, topic, language, rawItems);
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    // Alias for backward compatibility if needed
    public String getTargetLanguage() { return language; }
    public void setTargetLanguage(String targetLanguage) { this.language = targetLanguage; }

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
