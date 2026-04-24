const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalMigration() {
  const NEW_ID = '4085e515-86ea-45ee-8fcf-6cbf572bf2e9'; // Seu ID Real

  console.log(`🚀 RESGATANDO ABSOLUTAMENTE TUDO PARA O ID ${NEW_ID}...`);
  
  // Transfere tudo o que não for seu para você (limpeza total)
  const { error } = await supabase.from('products')
    .update({ user_id: NEW_ID })
    .neq('user_id', NEW_ID);
    
  if (error) console.error("Erro no resgate:", error.message);
  else console.log("✅ Todas as joias agora são suas!");
}

finalMigration();