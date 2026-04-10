-- Criar Tabela de Branding (Configurações da Marca)
CREATE TABLE IF NOT EXISTS branding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT DEFAULT 'LAPIDADO',
  primary_color TEXT DEFAULT '#4a322e',
  secondary_color TEXT DEFAULT '#c99090',
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  website TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir que a coluna business_name exista (caso a tabela já tenha sido criada)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'branding' AND COLUMN_NAME = 'business_name') THEN
        ALTER TABLE branding ADD COLUMN business_name TEXT DEFAULT 'LAPIDADO';
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;

-- SELECT: Público
DROP POLICY IF EXISTS "Branding is viewable by everyone" ON branding;
CREATE POLICY "Branding is viewable by everyone" 
ON branding FOR SELECT USING (true);

-- INSERT/UPDATE: Apenas Admin
DROP POLICY IF EXISTS "Admins can manage branding" ON branding;
CREATE POLICY "Admins can manage branding" 
ON branding FOR ALL 
TO authenticated 
USING (true);

-- Garantir um registro inicial
INSERT INTO branding (id, business_name) 
SELECT '00000000-0000-0000-0000-000000000000', 'LAPIDADO'
WHERE NOT EXISTS (SELECT 1 FROM branding WHERE id = '00000000-0000-0000-0000-000000000000');
