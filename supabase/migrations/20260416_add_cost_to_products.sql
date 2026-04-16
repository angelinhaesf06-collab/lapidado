-- 💎 NEXUS: CRIAÇÃO DE COLUNA DE CUSTO REAL
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;

-- Liberar acesso para todos (leitura)
DROP POLICY IF EXISTS "Public Access" ON products;
CREATE POLICY "Public Access" ON products FOR SELECT USING (true);
