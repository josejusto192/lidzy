-- Garante que a coluna existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_referencia TEXT UNIQUE;

-- Preenche usuários existentes que não têm código
UPDATE usuarios
SET codigo_referencia = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE codigo_referencia IS NULL OR codigo_referencia = '';

-- Trigger para gerar código automaticamente em novos cadastros
CREATE OR REPLACE FUNCTION gerar_codigo_referencia()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo_referencia IS NULL OR NEW.codigo_referencia = '' THEN
    NEW.codigo_referencia := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_gerar_codigo_referencia ON usuarios;
CREATE TRIGGER trigger_gerar_codigo_referencia
  BEFORE INSERT ON usuarios
  FOR EACH ROW EXECUTE FUNCTION gerar_codigo_referencia();
