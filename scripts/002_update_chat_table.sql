-- Adicionar coluna user_id à tabela n8n_chat_histories
ALTER TABLE public.n8n_chat_histories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_chat_histories_user_id ON public.n8n_chat_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_session_id ON public.n8n_chat_histories(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_timestamp ON public.n8n_chat_histories(timestamp DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para chat histories
CREATE POLICY "Usuários podem ver suas próprias mensagens"
  ON public.n8n_chat_histories
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem inserir suas próprias mensagens"
  ON public.n8n_chat_histories
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem atualizar suas próprias mensagens"
  ON public.n8n_chat_histories
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem deletar suas próprias mensagens"
  ON public.n8n_chat_histories
  FOR DELETE
  USING (auth.uid()::text = user_id::text);
