const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: Chaves do Supabase ausentes no .env');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('💎 NEXUS: Tentando criar a coluna business_name via SQL RPC...');

  // Tenta rodar o SQL via uma função RPC padrão que alguns templates do Supabase possuem
  const { error } = await supabase.rpc('exec_sql', { 
    sql_query: "ALTER TABLE branding ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT 'Lapidado';" 
  });

  if (error) {
    console.log('⚠️ RPC falhou (comum se a função não existir). Tentando via API de Schema...');
    // Se falhar, tentamos fazer um RPC genérico ou reportamos o comando exato
    console.log('\n---------------------------------------------------------');
    console.log('❌ O comando automático falhou. O Supabase exige que colunas');
    console.log('sejam criadas via SQL Editor por segurança.');
    console.log('\nPOR FAVOR, COPIE E COLE ISSO NO SQL EDITOR DO SUPABASE:');
    console.log("ALTER TABLE branding ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT 'Lapidado';");
    console.log('---------------------------------------------------------\n');
  } else {
    console.log('✅ SUCESSO! Coluna criada. O erro deve sumir agora.');
  }
}

fix();
