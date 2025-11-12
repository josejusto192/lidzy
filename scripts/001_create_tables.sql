-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  criado_em TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar tabela de contatos
CREATE TABLE IF NOT EXISTS public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa TEXT,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  website TEXT,
  status TEXT DEFAULT 'pendente',
  data_contato TIMESTAMP WITHOUT TIME ZONE,
  criado_em TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  nicho TEXT,
  mensagem_enviada TEXT,
  user_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT contatos_id_key UNIQUE (id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contatos_user_id ON public.contatos(user_id);
CREATE INDEX IF NOT EXISTS idx_contatos_status ON public.contatos(status);
CREATE INDEX IF NOT EXISTS idx_contatos_criado_em ON public.contatos(criado_em DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para usuarios
CREATE POLICY "Usuários podem ver seus próprios dados"
  ON public.usuarios
  FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Usuários podem atualizar seus próprios dados"
  ON public.usuarios
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Políticas de segurança para contatos
CREATE POLICY "Usuários podem ver seus próprios contatos"
  ON public.contatos
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem inserir seus próprios contatos"
  ON public.contatos
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem atualizar seus próprios contatos"
  ON public.contatos
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem deletar seus próprios contatos"
  ON public.contatos
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Função para criar usuário automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nome');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar usuário automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
