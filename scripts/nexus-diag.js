import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkData() {
  console.log('🔍 INVESTIGAÇÃO NEXUS: VERIFICANDO DADOS...')

  const { data: branding, error: bError } = await supabase.from('branding').select('id, store_name, slug, user_id')
  console.log('\n💎 BRANDING ENCONTRADO:', branding?.length || 0, 'registros')
  console.table(branding)

  const { data: products, error: pError } = await supabase.from('products').select('id, name, user_id').limit(5)
  console.log('\n💍 PRODUTOS ENCONTRADOS (Amostra):', products?.length || 0)
  console.table(products)

  if (branding && branding.length > 0) {
    const slug = branding[0].slug
    console.log(`\n💡 TENTE ACESSAR ESTE LINK: ?catalogo=true&loja=${slug}`)
  } else {
    console.log('\n❌ ERRO: Nenhuma marca (branding) encontrada no banco!')
  }
}

checkData()
