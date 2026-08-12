-- Performance indexes for frequently queried foreign keys and filters.

-- story_cards: chain_id is the primary join key in every chain fetch
CREATE INDEX IF NOT EXISTS idx_story_cards_chain_id ON story_cards (chain_id);

-- recall_sessions: filtered by chain and user in RecallSessionRepository
CREATE INDEX IF NOT EXISTS idx_recall_sessions_chain_id ON recall_sessions (chain_id);
CREATE INDEX IF NOT EXISTS idx_recall_sessions_user_id  ON recall_sessions (user_id);

-- memory_chains: library view sorts by created_at desc per user
CREATE INDEX IF NOT EXISTS idx_memory_chains_user_id_created ON memory_chains (user_id, created_at DESC);

-- memory_gaps: looked up by session in RecallEvaluationService
CREATE INDEX IF NOT EXISTS idx_memory_gaps_session_id ON memory_gaps (session_id);
