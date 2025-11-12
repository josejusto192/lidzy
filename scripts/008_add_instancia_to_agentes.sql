-- Add instancia_id column to agentes_prospeccao table
ALTER TABLE agentes_prospeccao
ADD COLUMN instancia_id UUID REFERENCES instancias(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_agentes_instancia ON agentes_prospeccao(instancia_id);
