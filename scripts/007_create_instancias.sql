-- Criar tabela de instâncias de WhatsApp
CREATE TABLE IF NOT EXISTS instancias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'Z-API',
  instance_id VARCHAR(255) NOT NULL,
  token TEXT NOT NULL,
  token_seguranca TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_instancias_user_id ON instancias(user_id);

-- Habilitar RLS
ALTER TABLE instancias ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver apenas suas próprias instâncias
CREATE POLICY "Usuários podem ver suas próprias instâncias"
  ON instancias FOR SELECT
  USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar suas próprias instâncias
CREATE POLICY "Usuários podem criar suas próprias instâncias"
  ON instancias FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar suas próprias instâncias
CREATE POLICY "Usuários podem atualizar suas próprias instâncias"
  ON instancias FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar suas próprias instâncias
CREATE POLICY "Usuários podem deletar suas próprias instâncias"
  ON instancias FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_instancias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_instancias_updated_at
  BEFORE UPDATE ON instancias
  FOR EACH ROW
  EXECUTE FUNCTION update_instancias_updated_at();
