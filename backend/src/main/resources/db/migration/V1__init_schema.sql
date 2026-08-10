CREATE TABLE IF NOT EXISTS memory_chains (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    raw_items TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS story_cards (
    id UUID PRIMARY KEY,
    chain_id UUID NOT NULL REFERENCES memory_chains(id) ON DELETE CASCADE,
    sequence_index INT NOT NULL,
    target_item VARCHAR(255) NOT NULL,
    story_segment TEXT NOT NULL,
    image_url TEXT,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recall_sessions (
    id UUID PRIMARY KEY,
    chain_id UUID NOT NULL REFERENCES memory_chains(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    accuracy_score DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memory_gaps (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES recall_sessions(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES story_cards(id) ON DELETE CASCADE,
    hint_revealed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_story_cards_chain_id ON story_cards(chain_id);
CREATE INDEX IF NOT EXISTS idx_recall_sessions_chain_id ON recall_sessions(chain_id);
CREATE INDEX IF NOT EXISTS idx_memory_gaps_session_id ON memory_gaps(session_id);
