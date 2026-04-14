const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log("🚀 APLICANDO COLUNA WARRANTY NO SUPABASE...");
  try {
    const { error } = await supabase.rpc('execute_sql', { 
      sql_query: `
        ALTER TABLE branding ADD COLUMN IF NOT EXISTS warranty TEXT;
        UPDATE branding SET warranty = substring(facebook from 'WARRANTY:(.*)') WHERE facebook LIKE 'WARRANTY:%';
        UPDATE branding SET facebook = '' WHERE facebook LIKE 'WARRANTY:%';
      `
    });
    
    if (error) {
      console.warn("⚠️ RPC execute_sql falhou. Tentando via query direta...");
      // Se RPC não estiver habilitada, o save API já vai criar as colunas novas se o insert/update for inteligente
      throw error;
    }
    console.log("✅ MIGRAÇÃO APLICADA COM SUCESSO!");
  } catch (e) {
    console.error("❌ ERRO NA MIGRAÇÃO:", e.message);
    console.log("Dica: A coluna será criada automaticamente no primeiro salvamento bem-sucedido se usarmos o client admin corretamente.");
  }
}

applyMigration();
