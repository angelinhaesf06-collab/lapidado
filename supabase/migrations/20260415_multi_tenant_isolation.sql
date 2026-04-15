-- ADICIONAR COLUNA USER_ID E ATUALIZAR RLS PARA MULTI-TENANCY (SaaS)

-- 1. ADICIONAR USER_ID NAS TABELAS PRINCIPAIS
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE branding ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. HABILITAR RLS EM TUDO
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA PRODUCTS (Só o dono gerencia, todos veem)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. POLÍTICAS PARA CATEGORIES (Só o dono gerencia, todos veem)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. POLÍTICAS PARA BRANDING (Só o dono gerencia, todos veem)
DROP POLICY IF EXISTS "Branding viewable by everyone" ON branding;
CREATE POLICY "Branding viewable by everyone" ON branding FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage branding" ON branding;
CREATE POLICY "Admins can manage branding" ON branding FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
