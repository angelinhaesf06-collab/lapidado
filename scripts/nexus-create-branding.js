import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function createBranding() {
  console.log('💎 CRIANDO MARCA LAPIDADO NO BANCO...')

  const userId = 'fc799d85-0264-4676-a0bb-cc27fca3b517'

  const { error } = await supabase.from('branding').insert([
    { 
      user_id: userId, 
      store_name: 'LAPIDADO', 
      slug: 'lapidado', 
      primary_color: '#4a322e', 
      secondary_color: '#c99090' 
    }
  ])

  if (error) {
    console.error('❌ ERRO AO CRIAR MARCA:', error.message)
  } else {
    console.log('\n✅ MARCA LAPIDADO CRIADA COM SUCESSO!')
    console.log('\n💎 TENTE ACESSAR O LINK AGORA:')
    console.log('👉 https://seu-site.vercel.app/?catalogo=true&loja=lapidado')
  }
}

createBranding()
