CREATE TABLE IF NOT EXISTS memory_chains (
    id UUID PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    target_language VARCHAR(50) NOT NULL,
    raw_items TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS story_cards (
    id UUID PRIMARY KEY,
    chain_id UUID NOT NULL REFERENCES memory_chains(id) ON DELETE CASCADE,
    sequence_index INT NOT NULL,
    target_item VARCHAR(255) NOT NULL,
    story_segment TEXT NOT NULL,
    image_prompt TEXT NOT NULL,
    image_url TEXT,
    audio_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_story_cards_chain_id ON story_cards(chain_id);
