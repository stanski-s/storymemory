DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='memory_chains' AND column_name='target_language') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='memory_chains' AND column_name='language') THEN
        ALTER TABLE memory_chains RENAME COLUMN target_language TO language;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='memory_chains' AND column_name='language') THEN
        ALTER TABLE memory_chains ADD COLUMN language VARCHAR(50) NOT NULL DEFAULT 'Spanish';
    END IF;
END $$;
