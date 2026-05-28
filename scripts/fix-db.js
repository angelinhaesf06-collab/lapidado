const { createClient } = require('./node_modules/@supabase/supabase-js');
const supabase = createClient('https://lkftxcnfzpjrhwjobfsr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZnR4Y25menBqcmh3am9iZnNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA1MTIyMywiZXhwIjoyMDkwNjI3MjIzfQ.CBj_vKfXyt4JrpKF3s4K46r5gM2OQ-hs2TNDLm4_OuE');

async function fixDatabase() {
  console.log('🚀 Iniciando atualização emergencial do banco...');
  
  // Como não temos acesso direto ao SQL via JS sem um RPC específico, 
  // vamos tentar verificar se conseguimos ao menos atualizar um registro 
  // fictício para testar se a coluna 'subscription_status' já existe por milagre 
  // ou se o erro de 'coluna não existe' persiste.
  
  const { error } = await supabase
    .from('branding')
    .update({ subscription_status: 'trial' })
    .eq('id', 'non-existent-id');

  if (error && error.message.includes('column "subscription_status" does not exist')) {
    console.log('❌ Confirmado: Colunas de assinatura estão FALTANDO.');
    console.log('👉 Por favor, execute o seguinte SQL no SQL Editor do Supabase Dashboard:');
    console.log(`
ALTER TABLE branding ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
ALTER TABLE branding ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days');
ALTER TABLE branding ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE branding ADD COLUMN IF NOT EXISTS google_play_subscription_id TEXT;
    `);
  } else {
    console.log('✅ As colunas parecem existir ou houve outro erro:', error?.message);
  }
}

fixDatabase();
