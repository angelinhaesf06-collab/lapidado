-- 💎 NEXUS: CONFIGURAÇÃO DEFINITIVA DE STORAGE (LAPIDADO)
-- Este script garante que os buckets existam e tenham permissões públicas totais para leitura.

-- 1. Garante que os buckets sejam públicos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpa políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view products" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload branding" ON storage.objects;

-- 3. Cria política de acesso público UNIVERSAL para leitura
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('products', 'branding'));

-- 4. Cria política para UPLOAD/UPDATE/DELETE (Apenas Autenticados ou via Service Role)
-- Nota: Service Role ignora RLS, mas usuários logados precisam dessa permissão.
CREATE POLICY "Admin All Access" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id IN ('products', 'branding'))
WITH CHECK (bucket_id IN ('products', 'branding'));
