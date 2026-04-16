import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkAuthSettings() {
  console.log('🔍 VERIFICANDO STATUS DE AUTENTICAÇÃO...')

  // Tenta listar usuários para ver se o serviço de Auth está respondendo
  const { data: { users }, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('❌ ERRO NO SERVIÇO DE AUTH:', error.message)
  } else {
    console.log('✅ Serviço de Autenticação está ONLINE.')
    console.log(`👥 Total de usuários cadastrados: ${users?.length}`)
  }
}

checkAuthSettings()
