-- Criar o balde (bucket) para armazenar logotipo e marca
INSERT INTO storage.buckets (id, name, public) 
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir que qualquer pessoa veja a marca
CREATE POLICY "Public Access Branding" ON storage.objects FOR SELECT USING (bucket_id = 'branding');

-- Permitir que apenas admins subam a marca
CREATE POLICY "Admin Upload Branding" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'branding' AND auth.role() = 'authenticated');
