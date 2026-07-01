-- Campos para inserção manual de leads (pessoa física e jurídica)
ALTER TABLE contatos ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE contatos ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'juridica'; -- 'juridica' | 'fisica'
ALTER TABLE contatos ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE contatos ADD COLUMN IF NOT EXISTS nome_completo TEXT; -- para pessoa física
