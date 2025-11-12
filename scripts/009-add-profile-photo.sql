-- Adiciona campo de foto de perfil na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil TEXT;

-- Adiciona comentário explicativo
COMMENT ON COLUMN usuarios.foto_perfil IS 'URL da foto de perfil do usuário (Vercel Blob)';
