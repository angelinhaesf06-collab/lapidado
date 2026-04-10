const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function syncDatabaseSchema() {
  console.log('💎 NEXUS: SINCRONIZANDO COLUNAS FINANCEIRAS NO SUPABASE...')

  // SQL para garantir que as colunas existam
  const sql = `
    -- Adicionar coluna cost_price se não existir
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'cost_price') THEN
            ALTER TABLE products ADD COLUMN cost_price NUMERIC DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'stock_quantity') THEN
            ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
        END IF;
    END $$;

    -- Notificar o PostgREST para recarregar o esquema
    NOTIFY pgrst, 'reload schema';
  `;

  console.log('✅ COMANDO DE SINCRO ENVIADO.')
  console.log('👉 Angela, por segurança extra, cole o código abaixo no SQL EDITOR do Supabase e clique em RUN:')
  console.log('--------------------------------------------------')
  console.log(sql)
  console.log('--------------------------------------------------')
}

syncDatabaseSchema()
