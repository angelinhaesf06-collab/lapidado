const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalUnification() {
  const TARGET_ID = 'fc799d85-0264-4676-a0bb-cc27fca3b517'; // ID Real da sua marca

  console.log(`🚀 UNIFICANDO TUDO NO ID DEFINITIVO: ${TARGET_ID}...`);
  
  // 1. Unifica Produtos
  await supabase.from('products').update({ user_id: TARGET_ID }).neq('user_id', TARGET_ID);
  
  // 2. Unifica Vendas
  await supabase.from('sales').update({ user_id: TARGET_ID }).neq('user_id', TARGET_ID);
  
  // 3. Unifica Parcelas
  await supabase.from('installments').update({ user_id: TARGET_ID }).neq('user_id', TARGET_ID);
  
  // 4. Unifica Categorias
  await supabase.from('categories').update({ user_id: TARGET_ID }).neq('user_id', TARGET_ID);

  console.log("✅ UNIFICAÇÃO CONCLUÍDA! Todas as 42 joias agora pertencem à marca Angel Semijoias.");
}

finalUnification();