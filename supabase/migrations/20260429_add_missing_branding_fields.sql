-- ADICIONAR COLUNAS FALTANTES PARA O NOVO SISTEMA DE BRANDING
ALTER TABLE branding ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE branding ADD COLUMN IF NOT EXISTS top_banner TEXT;
ALTER TABLE branding ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 10;
ALTER TABLE branding ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE branding ADD COLUMN IF NOT EXISTS tiktok TEXT;

-- MIGRAR DADOS DO CAMPO FACEBOOK (CASO AINDA NÃO TENHAM SIDO MIGRADOS)
UPDATE branding 
SET 
  tagline = split_part(facebook, '|', 1),
  installments = CASE 
    WHEN split_part(facebook, '|', 2) ~ '^[0-9]+$' THEN split_part(facebook, '|', 2)::INTEGER 
    ELSE 10 
  END,
  top_banner = split_part(facebook, '|', 3)
WHERE tagline IS NULL AND facebook IS NOT NULL AND facebook LIKE '%|%';
