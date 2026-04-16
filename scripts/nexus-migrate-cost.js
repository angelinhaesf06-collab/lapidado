import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function migrate() {
  console.log('💎 MIGRANDO CUSTOS ESCONDIDOS PARA COLUNA REAL...')

  const { data: products } = await supabase.from('products').select('*')
  
  if (!products) return

  for (const p of products) {
    const match = p.description?.match(/DATA:({.*})/)
    if (match) {
      try {
        const cost = JSON.parse(match[1]).cost
        await supabase.from('products').update({ cost_price: cost }).eq('id', p.id)
        console.log(`✅ Migrado: R$ ${cost} -> ${p.name}`)
      } catch(e) {
        console.error(`❌ Erro no produto ${p.name}`)
      }
    }
  }

  console.log('\n✅ MIGRAÇÃO CONCLUÍDA!')
}

migrate()
