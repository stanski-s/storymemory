package pl.pamiec.backend.chain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface MemoryChainRepository extends JpaRepository<MemoryChain, UUID> {
}
