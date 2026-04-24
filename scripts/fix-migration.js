const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migration() {
  const OLD_ID = 'fc799d85-0264-4676-a0bb-cc27fca3b517';
  const NEW_ID = '4085e515-86ea-45ee-8fcf-6cbf572bf2e9'; // O ID que tem 4 produtos recentes

  console.log(`🚀 MOVENDO PRODUTOS DE ${OLD_ID} PARA ${NEW_ID}...`);
  
  const { error: pErr } = await supabase.from('products').update({ user_id: NEW_ID }).eq('user_id', OLD_ID);
  const { error: sErr } = await supabase.from('sales').update({ user_id: NEW_ID }).eq('user_id', OLD_ID);
  const { error: iErr } = await supabase.from('installments').update({ user_id: NEW_ID }).eq('user_id', OLD_ID);
  
  if (pErr) console.error("Erro produtos:", pErr.message);
  else console.log("✅ Produtos migrados!");
}

migration();