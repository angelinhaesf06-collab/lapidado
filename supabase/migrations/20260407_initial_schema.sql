-- 1. Criar Tabela de Categorias
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar Tabela de Produtos (Joias)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  featured BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb, -- Para detalhes como material, banho, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS (Row Level Security) - SEGURANÇA MÁXIMA
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Acesso para Categorias
-- SELECT: Público
CREATE POLICY "Categories are viewable by everyone" 
ON categories FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: Apenas Admin (Usuário Autenticado)
CREATE POLICY "Admins can manage categories" 
ON categories FOR ALL 
TO authenticated 
USING (auth.role() = 'authenticated');

-- 5. Criar Políticas de Acesso para Produtos
-- SELECT: Público
CREATE POLICY "Products are viewable by everyone" 
ON products FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: Apenas Admin (Usuário Autenticado)
CREATE POLICY "Admins can manage products" 
ON products FOR ALL 
TO authenticated 
USING (auth.role() = 'authenticated');

-- 6. Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
