-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  categoria VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX idx_message_templates_categoria ON message_templates(categoria);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own templates"
  ON message_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON message_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON message_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON message_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default templates
INSERT INTO message_templates (user_id, nome, conteudo, categoria)
SELECT
  id as user_id,
  'Primeira Mensagem',
  'Olá {nome}! Tudo bem? Sou da {empresa} e gostaria de conversar sobre {assunto}.',
  'apresentacao'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE user_id = auth.users.id
);

INSERT INTO message_templates (user_id, nome, conteudo, categoria)
SELECT
  id as user_id,
  'Follow-up',
  'Oi {nome}! Vi que você demonstrou interesse. Posso te ajudar com mais informações?',
  'follow_up'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE user_id = auth.users.id AND categoria = 'follow_up'
);

INSERT INTO message_templates (user_id, nome, conteudo, categoria)
SELECT
  id as user_id,
  'Agradecimento',
  'Obrigado pelo seu contato, {nome}! Em breve retornaremos.',
  'agradecimento'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE user_id = auth.users.id AND categoria = 'agradecimento'
);
