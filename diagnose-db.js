const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function diagnoseDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: Variáveis do Supabase ausentes no .env");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("💎 DIAGNÓSTICO LAPIDADO - SUPABASE");
  console.log("-----------------------------------");

  // 1. Testar conexão básica e listar colunas (via select)
  console.log("1. Verificando estrutura da tabela 'products'...");
  const { data: sample, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error("❌ Erro ao ler tabela 'products':", fetchError.message);
  } else {
    console.log("✅ Conexão com 'products' OK.");
    if (sample && sample.length > 0) {
      console.log("Colunas detectadas:", Object.keys(sample[0]).join(', '));
    } else {
      console.log("Tabela vazia ou sem registros para amostra.");
    }
  }

  // 2. Tentar uma inserção mínima para testar RLS
  console.log("\n2. Testando inserção mínima (bypass RLS test)...");
  
  // Primeiro, precisamos de um ID de categoria válido
  const { data: categories } = await supabase.from('categories').select('id').limit(1);
  const catId = categories && categories.length > 0 ? categories[0].id : null;

  if (!catId) {
    console.log("⚠️ Nenhuma categoria encontrada. O teste de inserção pode falhar.");
  }

  const testProduct = {
    name: "PRODUTO TESTE DIAGNÓSTICO",
    price: 99.99,
    category_id: catId,
    description: "TESTE DE SISTEMA",
    user_id: '00000000-0000-0000-0000-000000000000' // ID fictício
  };

  const { data: insertData, error: insertError } = await supabase
    .from('products')
    .insert([testProduct])
    .select();

  if (insertError) {
    console.error("❌ ERRO NA INSERÇÃO:", insertError.message);
    if (insertError.message.includes("row-level security")) {
      console.log("\n🔍 ANÁLISE: O erro de RLS persiste mesmo usando a Service Role.");
      console.log("Isso geralmente significa que a tabela não tem NENHUMA política 'ENABLE' para o papel service_role ou o RLS está quebrado.");
    }
  } else {
    console.log("✅ INSERÇÃO REALIZADA COM SUCESSO!");
    console.log("ID do produto criado:", insertData[0].id);
    
    // Limpar o teste
    await supabase.from('products').delete().eq('id', insertData[0].id);
    console.log("🗑️ Registro de teste removido.");
  }
}

diagnoseDatabase();
