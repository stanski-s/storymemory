package pl.pamiec.backend.domain.recall;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecallSessionRepository extends JpaRepository<RecallSession, UUID> {
    List<RecallSession> findByChainIdOrderByCreatedAtDesc(UUID chainId);
}
