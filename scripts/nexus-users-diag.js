import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function getUsers() {
  console.log('👥 RAIO-X DE USUÁRIOS (ADMIN)...')

  const { data: { users }, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('❌ ERRO:', error.message)
    return
  }

  const list = users.map(u => ({ 
    id: u.id, 
    email: u.email, 
    last_login: u.last_sign_in_at 
  }))

  console.table(list)
}

getUsers()
