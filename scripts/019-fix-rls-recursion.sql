-- Remover políticas problemáticas que causam recursão infinita
DROP POLICY IF EXISTS "Super admin pode ver usuarios basicos" ON public.usuarios;
DROP POLICY IF EXISTS "Super admin pode ver estatisticas de contatos" ON public.contatos;
DROP POLICY IF EXISTS "Super admin pode ver projetos" ON public.projetos;
DROP POLICY IF EXISTS "Super admin pode ver agentes" ON public.agentes_prospeccao;
DROP POLICY IF EXISTS "Super admin pode ver instancias" ON public.instancias;

-- Criar função auxiliar que verifica se o usuário é super admin SEM causar recursão
-- Usa auth.jwt() para pegar o user_id diretamente do token
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS corretas SEM recursão
-- Super admin pode ver informações básicas dos usuários
CREATE POLICY "Super admin pode ver usuarios basicos"
  ON public.usuarios
  FOR SELECT
  USING (
    auth.uid()::text = id::text 
    OR 
    is_super_admin()
  );

-- Super admin pode ver estatísticas de contatos
CREATE POLICY "Super admin pode ver estatisticas de contatos"
  ON public.contatos
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text 
    OR 
    is_super_admin()
  );

-- Super admin pode ver projetos
CREATE POLICY "Super admin pode ver projetos"
  ON public.projetos
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text 
    OR 
    is_super_admin()
  );

-- Super admin pode ver agentes
CREATE POLICY "Super admin pode ver agentes"
  ON public.agentes_prospeccao
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text 
    OR 
    is_super_admin()
  );

-- Super admin pode ver instâncias
CREATE POLICY "Super admin pode ver instancias"
  ON public.instancias
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text 
    OR 
    is_super_admin()
  );

-- Garantir que a role está definida para o super admin
UPDATE usuarios 
SET role = 'super_admin' 
WHERE email = 'josejustods@gmail.com';
