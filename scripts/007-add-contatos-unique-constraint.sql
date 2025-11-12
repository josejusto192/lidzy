-- Adiciona constraint única composta em (telefone, user_id) na tabela contatos
-- Isso permite que diferentes usuários tenham o mesmo telefone,
-- mas impede que um usuário tenha telefones duplicados

-- Primeiro, remove duplicatas existentes (mantém apenas o mais recente)
DELETE FROM contatos a USING contatos b
WHERE a.id < b.id 
  AND a.telefone = b.telefone 
  AND a.user_id = b.user_id;

-- Adiciona a constraint única composta
ALTER TABLE contatos 
ADD CONSTRAINT contatos_telefone_user_id_unique 
UNIQUE (telefone, user_id);

-- Cria índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_contatos_telefone_user_id 
ON contatos(telefone, user_id);
