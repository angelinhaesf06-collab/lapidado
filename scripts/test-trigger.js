const { createClient } = require('../node_modules/@supabase/supabase-js');
const supabaseAdmin = createClient('https://lkftxcnfzpjrhwjobfsr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZnR4Y25menBqcmh3am9iZnNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA1MTIyMywiZXhwIjoyMDkwNjI3MjIzfQ.CBj_vKfXyt4JrpKF3s4K46r5gM2OQ-hs2TNDLm4_OuE', {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testCreateUser() {
  console.log('Tentando criar usuario de teste...');
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'test_error_trigger_' + Date.now() + '@example.com',
    password: 'password123',
    email_confirm: true
  });

  if (error) {
    console.error('ERRO AO CRIAR USUARIO:', error);
  } else {
    console.log('Usuario criado com sucesso!', data.user.id);
    // Cleanup
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    console.log('Usuario de teste apagado.');
  }
}

testCreateUser();
