import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fixFinal() {
  console.log('💎 NEXUS: ARREDONDANDO FINANCEIRO E IA...')

  // 1. Corrigir o custo nas vendas passadas (Sales)
  const { data: sales } = await supabase.from('sales').select('id, product_id, cost_price')
  const { data: products } = await supabase.from('products').select('id, cost_price')

  if (sales && products) {
    for (const sale of sales) {
      const prod = products.find(p => p.id === sale.product_id)
      if (prod && (sale.cost_price === 0 || !sale.cost_price)) {
        await supabase.from('sales').update({ cost_price: prod.cost_price }).eq('id', sale.id)
        console.log(`✅ Venda ${sale.id} atualizada com custo R$ ${prod.cost_price}`)
      }
    }
  }

  console.log('\n🚀 FINANCEIRO ATUALIZADO!')
}

fixFinal()
