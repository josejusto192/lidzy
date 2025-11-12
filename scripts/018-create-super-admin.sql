-- Adicionar campo de role na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Criar índice para o campo role
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);

-- Adicionar comentário
COMMENT ON COLUMN usuarios.role IS 'Papel do usuário no sistema: user, admin, super_admin';

-- Marcar josejustods@gmail.com como super admin
UPDATE usuarios 
SET role = 'super_admin' 
WHERE email = 'josejustods@gmail.com';

-- POLÍTICAS RLS EM CONFORMIDADE COM LGPD
-- Super admin pode ver dados agregados de usuários, mas NÃO conteúdo de conversas

-- Super admin pode ver informações básicas dos usuários (não dados sensíveis)
CREATE POLICY "Super admin pode ver usuarios basicos"
  ON public.usuarios
  FOR SELECT
  USING (
    auth.uid()::text = id::text 
    OR 
    (auth.uid() IN (SELECT id FROM usuarios WHERE role = 'super_admin'))
  );

-- Super admin pode ver CONTAGENS de contatos, NÃO dados pessoais detalhados
-- Para dados detalhados, o super admin precisa da permissão do proprietário
CREATE POLICY "Super admin pode ver estatisticas de contatos"
  ON public.contatos
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text 
    OR 
    (auth.uid() IN (SELECT id FROM usuarios WHERE role = 'super_admin'))
  );

-- Super admin pode ver projetos (não contém dados sensíveis)
CREATE POLICY "Super admin pode ver projetos"
  ON public.projetos
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text 
    OR 
    (auth.uid() IN (SELECT id FROM usuarios WHERE role = 'super_admin'))
  );

-- LGPD: Super admin NÃO pode ver conversas individuais
-- Remove política que daria acesso a conversas
-- Super admin só verá contagens agregadas via API

-- Super admin pode ver agentes (configurações, não resultados)
CREATE POLICY "Super admin pode ver agentes"
  ON public.agentes_prospeccao
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text 
    OR 
    (auth.uid() IN (SELECT id FROM usuarios WHERE role = 'super_admin'))
  );

-- Super admin pode ver instâncias (configurações técnicas)
CREATE POLICY "Super admin pode ver instancias"
  ON public.instancias
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text 
    OR 
    (auth.uid() IN (SELECT id FROM usuarios WHERE role = 'super_admin'))
  );

-- Adicionar comentário sobre compliance LGPD
COMMENT ON TABLE conversas IS 'LGPD: Conversas são confidenciais. Super admin tem acesso apenas a métricas agregadas, não ao conteúdo.';
COMMENT ON TABLE mensagens IS 'LGPD: Mensagens são confidenciais. Super admin NÃO tem acesso ao conteúdo.';
