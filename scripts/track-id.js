const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findTrueIdentity() {
  console.log("🔍 RASTREANDO IDENTIDADES NO BANCO...");
  
  // 1. Busca os usuários que têm branding configurado (Dona da loja)
  const { data: brands } = await supabase.from('branding').select('user_id, store_name, slug');
  console.log("Marcas encontradas:", brands);

  // 2. Busca onde estão os produtos
  const { data: allProds } = await supabase.from('products').select('user_id, name');
  const distribution = allProds.reduce((acc, p) => {
    acc[p.user_id] = (acc[p.user_id] || 0) + 1;
    return acc;
  }, {});

  console.log("Onde estão os produtos (Distribuição):", distribution);
}

findTrueIdentity();