-- Habilitar RLS em 'branding', 'categories' e 'products'
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para PRODUCTS
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Public Access" ON public.products;
DROP POLICY IF EXISTS "Owner can manage products" ON public.products;

CREATE POLICY "Public Access" ON public.products FOR SELECT USING (true);

CREATE POLICY "Owner can manage products" 
ON public.products FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 2. Políticas para CATEGORIES
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Public Access" ON public.categories;
DROP POLICY IF EXISTS "Owner can manage categories" ON public.categories;

CREATE POLICY "Public Access" ON public.categories FOR SELECT USING (true);

CREATE POLICY "Owner can manage categories" 
ON public.categories FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 3. Políticas para BRANDING
DROP POLICY IF EXISTS "Branding viewable by everyone" ON public.branding;
DROP POLICY IF EXISTS "Admins can manage branding" ON public.branding;
DROP POLICY IF EXISTS "Public Access" ON public.branding;
DROP POLICY IF EXISTS "Owner can manage branding" ON public.branding;

CREATE POLICY "Public Access" ON public.branding FOR SELECT USING (true);

CREATE POLICY "Owner can manage branding" 
ON public.branding FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
