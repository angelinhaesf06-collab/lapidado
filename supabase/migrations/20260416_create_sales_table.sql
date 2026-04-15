-- Criar Tabela de Vendas
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  sale_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  customer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas o dono da conta vê suas vendas
CREATE POLICY "Users can manage their own sales" 
ON sales FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);
