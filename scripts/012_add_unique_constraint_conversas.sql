-- Add unique constraint to prevent duplicate conversations
-- First, we need to clean up any existing duplicates

-- Step 1: Identify and keep only the oldest conversation for each phone+instancia combination
WITH ranked_conversas AS (
  SELECT 
    id,
    phone,
    instancia_id,
    ROW_NUMBER() OVER (
      PARTITION BY phone, instancia_id 
      ORDER BY created_at ASC
    ) as rn
  FROM conversas
)
-- Delete duplicate conversations (keep the oldest one)
DELETE FROM conversas
WHERE id IN (
  SELECT id 
  FROM ranked_conversas 
  WHERE rn > 1
);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE conversas
ADD CONSTRAINT conversas_phone_instancia_unique 
UNIQUE (phone, instancia_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversas_phone_instancia 
ON conversas(phone, instancia_id);
