-- ADICIONAR COLUNA PARA ORDEM DE EXIBIÇÃO PERSONALIZADA
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- INICIALIZAR A COLUNA COM BASE NA DATA DE CRIAÇÃO (PRODUTOS MAIS NOVOS PRIMEIRO)
-- Atribuímos números sequenciais negativos baseados no created_at para manter a ordem DESC padrão inicialmente
WITH ordered_products AS (
  SELECT id, row_number() OVER (ORDER BY created_at DESC) as row_num
  FROM products
)
UPDATE products
SET display_order = ordered_products.row_num
FROM ordered_products
WHERE products.id = ordered_products.id AND products.display_order IS NULL;
