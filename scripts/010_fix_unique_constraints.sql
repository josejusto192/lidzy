-- Adicionar constraints UNIQUE que estão faltando no banco de dados

-- 1. Adicionar UNIQUE constraint para contatos.telefone
-- Primeiro, remover constraint se já existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contatos_telefone_unique'
  ) THEN
    ALTER TABLE contatos DROP CONSTRAINT contatos_telefone_unique;
  END IF;
END $$;

-- Remover duplicatas usando ROW_NUMBER
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY telefone ORDER BY id::text) as rn
  FROM contatos
  WHERE telefone IS NOT NULL
)
DELETE FROM contatos
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Adicionar a constraint
ALTER TABLE contatos
ADD CONSTRAINT contatos_telefone_unique UNIQUE (telefone);

-- 2. Adicionar UNIQUE constraint para conversas.phone
-- Primeiro, remover constraint se já existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversas_phone_user_instancia_unique'
  ) THEN
    ALTER TABLE conversas DROP CONSTRAINT conversas_phone_user_instancia_unique;
  END IF;
END $$;

-- Remover duplicatas usando ROW_NUMBER
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY phone, user_id, instancia_id 
      ORDER BY id::text
    ) as rn
  FROM conversas
  WHERE phone IS NOT NULL
)
DELETE FROM conversas
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Adicionar constraint UNIQUE composta (phone + user_id + instancia_id)
ALTER TABLE conversas
ADD CONSTRAINT conversas_phone_user_instancia_unique 
UNIQUE (phone, user_id, instancia_id);

-- 3. Adicionar UNIQUE constraint para mensagens.message_id
-- Primeiro, remover constraint se já existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mensagens_message_id_unique'
  ) THEN
    ALTER TABLE mensagens DROP CONSTRAINT mensagens_message_id_unique;
  END IF;
END $$;

-- Remover duplicatas usando ROW_NUMBER
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY message_id ORDER BY id::text) as rn
  FROM mensagens
  WHERE message_id IS NOT NULL
)
DELETE FROM mensagens
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Adicionar a constraint
ALTER TABLE mensagens
ADD CONSTRAINT mensagens_message_id_unique UNIQUE (message_id);

-- 4. Adicionar índices compostos para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversas_user_phone 
ON conversas(user_id, phone);

CREATE INDEX IF NOT EXISTS idx_contatos_user_telefone 
ON contatos(user_id, telefone);

-- 5. Adicionar comentários para documentação
COMMENT ON CONSTRAINT contatos_telefone_unique ON contatos IS 
'Garante que cada telefone seja único no sistema';

COMMENT ON CONSTRAINT conversas_phone_user_instancia_unique ON conversas IS 
'Garante que cada combinação de telefone + usuário + instância seja única';

COMMENT ON CONSTRAINT mensagens_message_id_unique ON mensagens IS 
'Garante que cada message_id do Z-API seja único no sistema';
