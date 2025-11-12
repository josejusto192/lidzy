-- Criar tabela de sessões de chat
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    titulo TEXT DEFAULT 'Nova Conversa',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para buscar sessões por usuário
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);

-- Criar índice para ordenar por data de atualização
CREATE INDEX IF NOT EXISTS idx_chat_sessions_atualizado_em ON public.chat_sessions(atualizado_em DESC);

-- Habilitar RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias sessões
CREATE POLICY "Usuários podem ver suas próprias sessões"
    ON public.chat_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias sessões
CREATE POLICY "Usuários podem criar suas próprias sessões"
    ON public.chat_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias sessões
CREATE POLICY "Usuários podem atualizar suas próprias sessões"
    ON public.chat_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias sessões
CREATE POLICY "Usuários podem deletar suas próprias sessões"
    ON public.chat_sessions
    FOR DELETE
    USING (auth.uid() = user_id);
