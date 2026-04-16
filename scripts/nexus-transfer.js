import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function transferEverything() {
  console.log('🔄 TRANSFERÊNCIA NEXUS: MIGRANDO TUDO PARA O GMAIL...')

  // ID do Hotmail (Onde estão os dados)
  const oldId = 'fc799d85-0264-4676-a0bb-cc27fca3b517'
  // ID do Gmail (Onde você está logada agora)
  const newId = '7e3aa867-453e-4202-93f8-7280484ead54'

  // 1. Transferir Categorias
  const { error: cError } = await supabase.from('categories').update({ user_id: newId }).eq('user_id', oldId)
  console.log('📂 Categorias transferidas.')

  // 2. Transferir Produtos
  const { error: pError } = await supabase.from('products').update({ user_id: newId }).eq('user_id', oldId)
  console.log('💍 Produtos transferidos.')

  // 3. Transferir Marca (Branding)
  const { error: bError } = await supabase.from('branding').update({ user_id: newId }).eq('user_id', oldId)
  console.log('💎 Marca Lapidado transferida.')

  console.log('\n✅ TUDO SINCRONIZADO COM O SEU ACESSO ATUAL!')
  console.log('\n👉 Agora atualize o seu Painel Administrativo.')
}

transferEverything()
