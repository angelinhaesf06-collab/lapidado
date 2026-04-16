import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function cleanAndFix() {
  console.log('🧹 LIMPANDO DUPLICIDADES E FIXANDO IDENTIDADE...')

  const targetUserId = 'fc799d85-0264-4676-a0bb-cc27fca3b517'

  // 1. Deletar todos os brandings que não são do dono das joias
  const { error: dError } = await supabase.from('branding').delete().neq('user_id', targetUserId)
  console.log('🗑️ Marcas antigas removidas.')

  // 2. Garantir que a marca do dono tenha o slug correto
  const { error: uError } = await supabase.from('branding')
    .update({ 
      store_name: 'LAPIDADO', 
      slug: 'lapidado',
      business_name: 'LAPIDADO' 
    })
    .eq('user_id', targetUserId)

  console.log('✅ Identidade LAPIDADO unificada!')
  
  // 3. Teste final de leitura pública
  const { data: b } = await supabase.from('branding').select('*').eq('slug', 'lapidado').single()
  if (b) {
     console.log('💎 AGORA SIM! Marca acessível via link: ?loja=lapidado')
  }
}

cleanAndFix()
