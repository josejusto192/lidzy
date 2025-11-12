-- Adiciona campos de perfil do usuário
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(18),
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS foto_perfil TEXT;

-- Adiciona comentários para documentação
COMMENT ON COLUMN usuarios.telefone IS 'Telefone do usuário';
COMMENT ON COLUMN usuarios.data_nascimento IS 'Data de nascimento do usuário';
COMMENT ON COLUMN usuarios.cpf_cnpj IS 'CPF ou CNPJ do usuário';
COMMENT ON COLUMN usuarios.endereco IS 'Endereço completo do usuário';
COMMENT ON COLUMN usuarios.cidade IS 'Cidade do usuário';
COMMENT ON COLUMN usuarios.estado IS 'Estado (UF) do usuário';
COMMENT ON COLUMN usuarios.cep IS 'CEP do usuário';
COMMENT ON COLUMN usuarios.foto_perfil IS 'URL da foto de perfil do usuário';
