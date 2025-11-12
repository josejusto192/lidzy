-- Add unique constraint to conversas table for phone + instancia_id
-- This allows ON CONFLICT to work in the n8n webhook

ALTER TABLE conversas 
ADD CONSTRAINT conversas_phone_instancia_unique 
UNIQUE (phone, instancia_id);

-- Create index for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_conversas_phone_instancia 
ON conversas(phone, instancia_id);
