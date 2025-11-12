-- Criar tabela de conversas
CREATE TABLE IF NOT EXISTS conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  instancia_id UUID NOT NULL REFERENCES instancias(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  agente_id UUID REFERENCES agentes_prospeccao(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  chat_name TEXT,
  photo TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  from_me BOOLEAN NOT NULL,
  message TEXT,
  status TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversas_user_id ON conversas(user_id);
CREATE INDEX IF NOT EXISTS idx_conversas_instancia_id ON conversas(instancia_id);
CREATE INDEX IF NOT EXISTS idx_conversas_phone ON conversas(phone);
CREATE INDEX IF NOT EXISTS idx_conversas_last_message_at ON conversas(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_id ON mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_message_id ON mensagens(message_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_timestamp ON mensagens(timestamp DESC);

-- RLS Policies para conversas
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversas"
  ON conversas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversas"
  ON conversas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversas"
  ON conversas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversas"
  ON conversas FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para mensagens
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their conversas"
  ON mensagens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
      AND conversas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversas"
  ON mensagens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
      AND conversas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their conversas"
  ON mensagens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
      AND conversas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversas"
  ON mensagens FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
      AND conversas.user_id = auth.uid()
    )
  );
