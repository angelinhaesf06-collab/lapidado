-- Adicionar campo de preço de custo para cálculos financeiros
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT 0;
