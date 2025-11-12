-- Add valor (value/amount) field to contatos table for revenue tracking
-- This allows tracking project values when deals progress through the pipeline

ALTER TABLE contatos
ADD COLUMN IF NOT EXISTS valor DECIMAL(10, 2) DEFAULT 0;

-- Add comment to explain the field
COMMENT ON COLUMN contatos.valor IS 'Valor do projeto/negócio em reais para tracking de faturamento';

-- Create index for revenue queries
CREATE INDEX IF NOT EXISTS idx_contatos_valor ON contatos(valor) WHERE valor > 0;

-- Create index for won deals with value (for revenue reporting)
CREATE INDEX IF NOT EXISTS idx_contatos_ganho_valor ON contatos(status, valor) WHERE status = 'ganho' AND valor > 0;
