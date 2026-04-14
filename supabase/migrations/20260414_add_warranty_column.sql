-- Adiciona a coluna de garantia na tabela branding
ALTER TABLE branding ADD COLUMN IF NOT EXISTS warranty TEXT;

-- Migra os dados que estavam no campo facebook por erro
UPDATE branding SET warranty = substring(facebook from 'WARRANTY:(.*)') WHERE facebook LIKE 'WARRANTY:%';
UPDATE branding SET facebook = '' WHERE facebook LIKE 'WARRANTY:%';
