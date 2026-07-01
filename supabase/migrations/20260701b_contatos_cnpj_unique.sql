-- Adiciona constraint única em (cnpj, user_id) para permitir upsert por CNPJ.
-- Remove duplicatas de CNPJ por usuário antes (mantém o registro mais recente).

DELETE FROM contatos a
USING contatos b
WHERE a.id < b.id
  AND a.cnpj IS NOT NULL
  AND a.cnpj <> ''
  AND a.cnpj = b.cnpj
  AND a.user_id = b.user_id;

-- Adiciona a constraint (ignora linhas onde cnpj é NULL)
ALTER TABLE contatos
  ADD CONSTRAINT contatos_cnpj_user_id_unique UNIQUE (cnpj, user_id);

CREATE INDEX IF NOT EXISTS idx_contatos_cnpj_user_id ON contatos (cnpj, user_id);
