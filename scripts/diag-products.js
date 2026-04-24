const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseProducts() {
  console.log("🔍 DIAGNÓSTICO DE PRODUTOS...");
  
  // 1. Busca TODOS os produtos sem filtro de usuário
  const { data: allProds, error } = await supabase.from('products').select('id, name, user_id, created_at');
  
  if (error) {
    console.error("Erro ao buscar:", error.message);
    return;
  }

  console.log(`Total de produtos no banco: ${allProds.length}`);
  
  // Agrupa por user_id para ver quem é o dono de cada lote
  const groups = allProds.reduce((acc, p) => {
    acc[p.user_id] = (acc[p.user_id] || 0) + 1;
    return acc;
  }, {});

  console.log("Distribuição por Usuário:", groups);
}

diagnoseProducts();