import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function unifyData() {
  console.log('🔍 UNIFICAÇÃO NEXUS: SINCRONIZANDO MARCA E PRODUTOS...')

  // 1. Identificar o ID do dono das joias
  const userId = 'fc799d85-0264-4676-a0bb-cc27fca3b517'

  // 2. Atualizar todas as marcas no banco para esse dono
  const { error: bError } = await supabase.from('branding')
    .update({ 
      user_id: userId, 
      store_name: 'LAPIDADO', 
      slug: 'lapidado' 
    })
    .is('user_id', '7e3aa867-453e-4202-93f8-7280484ead54') // ID antigo que encontramos no diagnóstico

  if (bError) {
    // Tenta outro método se falhar
    await supabase.from('branding')
      .update({ user_id: userId, store_name: 'LAPIDADO', slug: 'lapidado' })
      .limit(1)
  }

  // 3. Garantir que as categorias e produtos também pertençam a ele
  await supabase.from('categories').update({ user_id: userId }).is('user_id', null)
  await supabase.from('products').update({ user_id: userId }).is('user_id', null)

  console.log('\n✅ DADOS UNIFICADOS COM SUCESSO!')
  console.log('\n💎 TENTE ACESSAR ESTE LINK AGORA:')
  console.log('👉 https://seu-site.vercel.app/?catalogo=true&loja=lapidado')
}

unifyData()
