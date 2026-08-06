package pl.pamiec.backend.domain.chain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StoryCardRepository extends JpaRepository<StoryCard, UUID> {
}
