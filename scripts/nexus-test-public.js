import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

// 💎 TESTE COMO UM CLIENTE ANÔNIMO (ANON KEY)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function testPublicAccess() {
  console.log('🔍 TESTE DE ACESSO PÚBLICO (ANON)...')

  const { data: b, error: be } = await supabase.from('branding').select('*').eq('slug', 'lapidado').single()
  console.log('💎 MARCA ACESSÍVEL?', b ? 'SIM' : 'NÃO', be?.message || '')

  if (b) {
    const { data: c, error: ce } = await supabase.from('categories').select('*').eq('user_id', b.user_id)
    console.log('📂 CATEGORIAS ACESSÍVEIS?', c?.length || 0, ce?.message || '')

    const { data: p, error: pe } = await supabase.from('products').select('*').eq('user_id', b.user_id)
    console.log('💍 PRODUTOS ACESSÍVEIS?', p?.length || 0, pe?.message || '')
  }
}

testPublicAccess()
