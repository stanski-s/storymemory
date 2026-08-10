package pl.pamiec.backend.domain.recall;

import jakarta.persistence.*;
import pl.pamiec.backend.domain.chain.MemoryChain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "recall_sessions")
public class RecallSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chain_id", nullable = false)
    private MemoryChain chain;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "accuracy_score", nullable = false)
    private Double accuracyScore;

    @Column(nullable = false)
    private String mode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<MemoryGap> gaps = new ArrayList<>();

    public RecallSession() {}

    public RecallSession(MemoryChain chain, String userId, Double accuracyScore, String mode) {
        this.chain = chain;
        this.userId = userId != null ? userId : "00000000-0000-0000-0000-000000000000";
        this.accuracyScore = accuracyScore;
        this.mode = mode != null ? mode : "STEP_BY_STEP";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public MemoryChain getChain() { return chain; }
    public void setChain(MemoryChain chain) { this.chain = chain; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Double getAccuracyScore() { return accuracyScore; }
    public void setAccuracyScore(Double accuracyScore) { this.accuracyScore = accuracyScore; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public Instant getCreatedAt() { return createdAt; }

    public List<MemoryGap> getGaps() { return gaps; }
    public void setGaps(List<MemoryGap> gaps) { this.gaps = gaps; }

    public void addGap(MemoryGap gap) {
        gaps.add(gap);
        gap.setSession(this);
    }
}
