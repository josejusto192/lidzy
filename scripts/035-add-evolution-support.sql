-- Migration: Add Evolution API support
-- This migration adds Evolution API as a third provider option alongside Z-API and Baileys

-- 1. Update provider constraint to include 'evolution'
ALTER TABLE instancias
DROP CONSTRAINT IF EXISTS instancias_provider_check;

ALTER TABLE instancias
ADD CONSTRAINT instancias_provider_check
CHECK (provider IN ('zapi', 'baileys', 'evolution'));

-- 2. Add comment explaining the evolution provider
COMMENT ON COLUMN instancias.provider IS 'WhatsApp provider: zapi (Z-API externo), baileys (self-hosted), evolution (Evolution API self-hosted)';

-- 3. Update existing baileys instances to evolution if needed (optional migration path)
-- Uncomment the line below if you want to migrate existing baileys instances to evolution
-- UPDATE instancias SET provider = 'evolution' WHERE provider = 'baileys';

-- Verify the changes
DO $$
BEGIN
  -- Check if provider column exists and has the right constraint
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instancias'
    AND column_name = 'provider'
  ) THEN
    RAISE EXCEPTION 'Migration failed: provider column does not exist';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Evolution API is now available as a provider option';
END $$;
