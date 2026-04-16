import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fixHistory() {
  console.log('💎 NEXUS: CONSERTANDO HISTÓRICO FINANCEIRO...')

  // 1. Pegar vendas que estão com custo 0
  const { data: sales } = await supabase.from('sales').select('*, products(cost_price)')
  
  if (!sales) return

  for (const sale of sales) {
    const realCost = sale.products?.cost_price || 0
    if (sale.cost_price === 0 && realCost > 0) {
      console.log(`✅ Ajustando custo da venda ${sale.id.substring(0,5)} para R$ ${realCost}`)
      await supabase.from('sales').update({ cost_price: realCost }).eq('id', sale.id)
    }
  }

  console.log('\n✅ HISTÓRICO ATUALIZADO COM SUCESSO!')
}

fixHistory()
