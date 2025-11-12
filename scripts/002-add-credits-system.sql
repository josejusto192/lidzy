-- Adicionar campos de créditos na tabela usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS creditos_leads_usados INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS creditos_mensagens_usados INTEGER DEFAULT 0;

-- Criar tabela de histórico de créditos
CREATE TABLE IF NOT EXISTS historico_creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'compra', 'uso_lead', 'uso_mensagem', 'bonus', 'estorno'
  quantidade INTEGER NOT NULL, -- positivo para adição, negativo para uso
  saldo_anterior INTEGER NOT NULL,
  saldo_novo INTEGER NOT NULL,
  descricao TEXT,
  metadata JSONB, -- dados adicionais como lead_id, mensagem_id, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_creditos_user_id ON historico_creditos(user_id);
CREATE INDEX IF NOT EXISTS idx_historico_creditos_tipo ON historico_creditos(tipo);
CREATE INDEX IF NOT EXISTS idx_historico_creditos_created_at ON historico_creditos(created_at DESC);

-- Adicionar alguns créditos iniciais para usuários existentes (opcional)
UPDATE usuarios SET creditos = 100 WHERE creditos = 0;

-- Comentários nas colunas
COMMENT ON COLUMN usuarios.creditos IS 'Saldo atual de créditos do usuário';
COMMENT ON COLUMN usuarios.creditos_leads_usados IS 'Total de créditos usados para geração de leads';
COMMENT ON COLUMN usuarios.creditos_mensagens_usados IS 'Total de créditos usados para envio de mensagens';
COMMENT ON TABLE historico_creditos IS 'Histórico de todas as transações de créditos';
