const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSignup() {
  const testEmail = `angela_teste_${Date.now()}@gmail.com`;
  const testPass = 'Angela2026!@#';
  
  console.log(`🚀 TESTANDO SIGNUP COM: ${testEmail}`);
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPass,
  });

  if (error) {
    console.error('❌ ERRO NO SIGNUP:', error.message);
    if (error.details) console.error('DETALHES:', error.details);
    if (error.hint) console.error('HINT:', error.hint);
  } else {
    console.log('✅ SIGNUP SUCESSO!', data.user.id);
  }
}

testSignup();
