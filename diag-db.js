const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("🔍 TESTANDO BANCO DE DADOS...");
  try {
    const { data, error } = await supabase.from('branding').select('*').limit(1);
    if (error) throw error;
    console.log("✅ TABELA 'branding' ACESSÍVEL!", data);

    const { data: products, error: pError } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (pError) throw pError;
    console.log("✅ TABELA 'products' ACESSÍVEL! Total:", products);
  } catch (e) {
    console.error("❌ ERRO NO BANCO:", e.message);
  }
}

test();
