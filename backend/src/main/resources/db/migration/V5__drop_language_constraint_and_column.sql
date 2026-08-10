DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='memory_chains' AND column_name='language') THEN
        ALTER TABLE memory_chains ALTER COLUMN language DROP NOT NULL;
        ALTER TABLE memory_chains DROP COLUMN IF EXISTS language;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='memory_chains' AND column_name='target_language') THEN
        ALTER TABLE memory_chains ALTER COLUMN target_language DROP NOT NULL;
        ALTER TABLE memory_chains DROP COLUMN IF EXISTS target_language;
    END IF;
END $$;
