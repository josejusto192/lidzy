-- Remove conversas duplicadas, mantendo apenas a mais recente
-- Este script identifica conversas com o mesmo phone + instancia_id
-- e mantém apenas a que tem o created_at mais recente

WITH duplicates AS (
  SELECT 
    id,
    phone,
    instancia_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY phone, instancia_id 
      ORDER BY created_at DESC
    ) as rn
  FROM conversas
)
DELETE FROM conversas
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- Verificar quantas conversas restaram
SELECT 
  phone,
  instancia_id,
  COUNT(*) as total
FROM conversas
GROUP BY phone, instancia_id
HAVING COUNT(*) > 1;
