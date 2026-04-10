-- 1. Habilitar RLS nas tabelas (caso não estejam)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para CATEGORIES
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" 
ON categories FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 3. Políticas para PRODUCTS
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" 
ON products FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
