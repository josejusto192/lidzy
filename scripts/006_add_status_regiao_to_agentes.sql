-- Add status and regiao arrays to agentes_prospeccao table
ALTER TABLE agentes_prospeccao
ADD COLUMN IF NOT EXISTS status TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS regiao TEXT[] DEFAULT '{}';

-- Update existing rows to have empty arrays if null
UPDATE agentes_prospeccao
SET status = '{}' WHERE status IS NULL;

UPDATE agentes_prospeccao
SET regiao = '{}' WHERE regiao IS NULL;
