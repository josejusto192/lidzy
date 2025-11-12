-- Script para corrigir associações entre conversas e contatos baseado no telefone
-- Este script atualiza conversas.contato_id quando o telefone corresponde

-- Primeiro, vamos ver quantas conversas não têm contato_id mas deveriam ter
DO $$
DECLARE
  conversas_sem_contato INTEGER;
  conversas_atualizadas INTEGER;
BEGIN
  -- Contar conversas sem contato_id
  SELECT COUNT(*) INTO conversas_sem_contato
  FROM conversas
  WHERE contato_id IS NULL;
  
  RAISE NOTICE 'Conversas sem contato_id: %', conversas_sem_contato;
  
  -- Atualizar conversas.contato_id baseado na correspondência de telefone
  -- Remove todos os caracteres não numéricos para comparação
  UPDATE conversas c
  SET contato_id = ct.id,
      updated_at = NOW()
  FROM contatos ct
  WHERE c.contato_id IS NULL
    AND c.user_id = ct.user_id
    AND REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(ct.telefone, '[^0-9]', '', 'g');
  
  GET DIAGNOSTICS conversas_atualizadas = ROW_COUNT;
  
  RAISE NOTICE 'Conversas atualizadas: %', conversas_atualizadas;
  
  -- Mostrar conversas que ainda não têm contato_id
  SELECT COUNT(*) INTO conversas_sem_contato
  FROM conversas
  WHERE contato_id IS NULL;
  
  RAISE NOTICE 'Conversas ainda sem contato_id: %', conversas_sem_contato;
END $$;

-- Criar índice para melhorar performance das buscas por telefone
CREATE INDEX IF NOT EXISTS idx_contatos_telefone_normalized 
ON contatos (REGEXP_REPLACE(telefone, '[^0-9]', '', 'g'));

CREATE INDEX IF NOT EXISTS idx_conversas_phone_normalized 
ON conversas (REGEXP_REPLACE(phone, '[^0-9]', '', 'g'));
