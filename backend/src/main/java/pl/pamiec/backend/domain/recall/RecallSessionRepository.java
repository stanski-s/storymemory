package pl.pamiec.backend.domain.recall;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecallSessionRepository extends JpaRepository<RecallSession, UUID> {
    List<RecallSession> findByChainIdOrderByCreatedAtDesc(UUID chainId);
    List<RecallSession> findByUserIdOrderByCreatedAtDesc(String userId);
    long countByUserId(String userId);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(r.accuracyScore) FROM RecallSession r WHERE r.userId = :userId")
    Double findAverageAccuracyScoreByUserId(@org.springframework.data.repository.query.Param("userId") String userId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(g) FROM RecallSession r JOIN r.gaps g WHERE r.userId = :userId")
    long countMemoryGapsByUserId(@org.springframework.data.repository.query.Param("userId") String userId);
}
