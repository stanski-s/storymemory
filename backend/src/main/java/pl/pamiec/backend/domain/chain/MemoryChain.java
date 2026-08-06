package pl.pamiec.backend.domain.chain;

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
    private UUID userId;

    @Column(nullable = false)
    private String topic;

    @Column(nullable = false)
    private String language;

    @Column(name = "raw_items", nullable = false, columnDefinition = "TEXT")
    private String rawItems;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChainStatus status = ChainStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "chain", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("sequenceIndex ASC")
    private List<StoryCard> cards = new ArrayList<>();

    public MemoryChain() {}

    public MemoryChain(UUID userId, String topic, String language, String rawItems) {
        this.userId = userId;
        this.topic = topic;
        this.language = language;
        this.rawItems = rawItems;
    }

    public MemoryChain(String topic, String language, String rawItems) {
        this(UUID.fromString("00000000-0000-0000-0000-000000000000"), topic, language, rawItems);
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getRawItems() { return rawItems; }
    public void setRawItems(String rawItems) { this.rawItems = rawItems; }

    public ChainStatus getStatus() { return status; }
    public void setStatus(ChainStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }

    public List<StoryCard> getCards() { return cards; }
    public void setCards(List<StoryCard> cards) { this.cards = cards; }

    public void addCard(StoryCard card) {
        cards.add(card);
        card.setChain(this);
    }
}
