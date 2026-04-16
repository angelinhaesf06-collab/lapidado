-- Adicionar coluna slug na tabela branding para identificação na URL
ALTER TABLE branding ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Criar um índice para buscas rápidas por slug
CREATE INDEX IF NOT EXISTS idx_branding_slug ON branding(slug);

-- Gerar slugs iniciais baseados no store_name (se existir)
UPDATE branding 
SET slug = lower(regexp_replace(store_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND store_name IS NOT NULL;

-- Se ainda houver nulos (marcas sem nome), usa o ID truncado
UPDATE branding
SET slug = 'loja-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

-- Tornar slug obrigatório após preenchimento
ALTER TABLE branding ALTER COLUMN slug SET NOT NULL;
