package pl.pamiec.backend.chain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface StoryCardRepository extends JpaRepository<StoryCard, UUID> {
    List<StoryCard> findByChainIdOrderBySequenceIndexAsc(UUID chainId);
}
