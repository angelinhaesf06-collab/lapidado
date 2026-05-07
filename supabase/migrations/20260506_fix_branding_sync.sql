-- GATILHO PARA ATUALIZAR O UPDATED_AT DA TABELA BRANDING
-- Isso garante que a ordenação pelo registro mais recente sempre funcione

CREATE OR REPLACE TRIGGER update_branding_updated_at
    BEFORE UPDATE ON branding
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- GARANTIR QUE TODOS OS REGISTROS ATUAIS TENHAM UM STORE_NAME VALIDO
UPDATE branding 
SET store_name = business_name 
WHERE store_name IS NULL OR store_name = '';

-- LIMPEZA PREVENTIVA: Se houver registros duplicados para o mesmo user_id, 
-- mantemos apenas o que tem o maior updated_at (o mais recente).
DELETE FROM branding
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM branding
  WHERE user_id IS NOT NULL
  ORDER BY user_id, updated_at DESC
) AND user_id IS NOT NULL;
