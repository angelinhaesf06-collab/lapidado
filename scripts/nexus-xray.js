import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function xray() {
  console.log('💎 RAIO-X LAPIDADO 💎')

  // 1. Verificar Branding
  const { data: b } = await supabase.from('branding').select('*')
  console.log('\nMARCAS (Branding):', b?.length || 0)
  console.table(b?.map(m => ({ id: m.id, store: m.store_name, slug: m.slug, user: m.user_id })))

  // 2. Verificar Categorias
  const { data: c } = await supabase.from('categories').select('*')
  console.log('\nCATEGORIAS:', c?.length || 0)
  console.table(c?.map(cat => ({ id: cat.id, name: cat.name, user: cat.user_id })))

  // 3. Verificar Produtos
  const { data: p } = await supabase.from('products').select('id, name, user_id, category_id').limit(5)
  console.log('\nPRODUTOS (Amostra):', p?.length || 0)
  console.table(p)

  // 4. Testar a Query exata que o site faz
  console.log('\n🔍 TESTANDO QUERY DO SITE...')
  const slug = 'lapidado'
  const { data: store } = await supabase.from('branding').select('*').eq('slug', slug).single()
  
  if (store) {
    console.log('✅ Marca "lapidado" encontrada!')
    const { data: cats } = await supabase.from('categories').select('*').eq('user_id', store.user_id)
    console.log(`📂 Categorias para este dono (${store.user_id}):`, cats?.length || 0)
    
    const { data: prods } = await supabase.from('products').select('*, categories!inner(name)').eq('user_id', store.user_id)
    console.log(`💍 Produtos com categoria para este dono:`, prods?.length || 0)
  } else {
    console.log('❌ Marca "lapidado" NÃO encontrada via SLUG!')
  }
}

xray()
