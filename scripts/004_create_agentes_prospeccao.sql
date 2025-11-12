-- Create table for prospecting agents configuration
CREATE TABLE IF NOT EXISTS agentes_prospeccao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao_persona TEXT,
  produto_servico TEXT NOT NULL,
  tom_voz VARCHAR(100) NOT NULL,
  objetivo TEXT,
  informacoes_adicionais TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_agentes_prospeccao_user_id ON agentes_prospeccao(user_id);

-- Add RLS policies
ALTER TABLE agentes_prospeccao ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own agents
CREATE POLICY "Users can view own agents" ON agentes_prospeccao
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own agents
CREATE POLICY "Users can insert own agents" ON agentes_prospeccao
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own agents
CREATE POLICY "Users can update own agents" ON agentes_prospeccao
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own agents
CREATE POLICY "Users can delete own agents" ON agentes_prospeccao
  FOR DELETE USING (auth.uid() = user_id);
