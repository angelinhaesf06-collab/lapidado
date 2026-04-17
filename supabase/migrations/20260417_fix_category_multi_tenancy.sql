-- 🛠️ CORREÇÃO DE MULTI-TENANCY PARA CATEGORIAS
-- Permite que cada empresária tenha suas próprias categorias com o mesmo nome (ex: Ambas terem 'BRINCOS')

-- 1. Remover as restrições de unicidade globais que estão travando o sistema multi-marcas
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;

-- 2. Criar novas restrições de unicidade COMPOSTAS (Nome + UserID)
-- Isso garante que o nome seja único APENAS para aquela empresária específica
ALTER TABLE public.categories ADD CONSTRAINT categories_name_user_unique UNIQUE (name, user_id);
ALTER TABLE public.categories ADD CONSTRAINT categories_slug_user_unique UNIQUE (slug, user_id);

-- 3. Garantir que o RLS (Row Level Security) esteja protegendo tudo
-- Apenas o dono da categoria pode ver/editar suas próprias categorias no admin
-- (A leitura pública já é permitida para o catálogo funcionar)
DROP POLICY IF EXISTS "Owner can manage categories" ON public.categories;
CREATE POLICY "Owner can manage categories" 
ON public.categories FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. Criar um índice para acelerar as buscas filtradas por usuário
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
