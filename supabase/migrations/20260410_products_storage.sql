-- Criar o balde (bucket) para armazenar fotos das joias
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir que qualquer pessoa veja as joias
CREATE POLICY "Public Access Products" ON storage.objects FOR SELECT USING (bucket_id = 'products');

-- Permitir que apenas admins subam fotos de joias
CREATE POLICY "Admin Upload Products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');
