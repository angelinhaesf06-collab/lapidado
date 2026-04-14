const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log("🔍 AUDITANDO TABELA BRANDING...");
  try {
    // Busca um registro para ver as colunas
    const { data, error } = await supabase.from('branding').select('*').limit(1).single();
    if (error) throw error;
    
    console.log("✅ COLUNAS ENCONTRADAS:", Object.keys(data));
    console.log("📝 DADOS ATUAIS:", data);
  } catch (e) {
    console.error("❌ ERRO NA AUDITORIA:", e.message);
  }
}

checkSchema();
