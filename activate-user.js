const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function activateUser() {
  const email = 'angelprsp@hotmail.com'; // O e-mail da sua captura de tela
  
  console.log(`🔍 BUSCANDO USUÁRIO: ${email}`);
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ ERRO AO LISTAR:', listError.message);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('❌ USUÁRIO NÃO ENCONTRADO NA LISTA.');
    return;
  }

  console.log(`💎 USUÁRIO ENCONTRADO! ID: ${user.id}`);

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (error) {
    console.error('❌ ERRO AO ATIVAR:', error.message);
  } else {
    console.log('✅ SUCESSO! O USUÁRIO FOI ATIVADO MANUALMENTE POR MIM. 🚀');
    console.log('Agora você já pode fazer o LOGIN direto no site!');
  }
}

activateUser();
