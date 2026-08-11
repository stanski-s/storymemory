package pl.pamiec.backend.domain.chain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MemoryChainRepository extends JpaRepository<MemoryChain, UUID> {
    java.util.List<MemoryChain> findByUserIdOrderByCreatedAtDesc(String userId);
    long countByUserId(String userId);
}
