-- Cria bucket público para avatares no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de avatares (apenas usuários autenticados)
CREATE POLICY "Usuários podem fazer upload de seus avatares"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'perfil');

-- Política para permitir leitura pública de avatares
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política para permitir deletar próprios avatares
CREATE POLICY "Usuários podem deletar seus avatares"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'perfil');
