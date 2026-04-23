const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function healInstallments() {
  console.log("💎 INICIANDO AUTO-CURA FINANCEIRA LAPIDADO...");

  // 1. Buscar todas as vendas
  const { data: sales, error: salesError } = await supabase.from('sales').select('*');
  if (salesError) return console.error("Erro ao buscar vendas:", salesError.message);

  // 2. Buscar vendas que já têm parcelas para não duplicar
  const { data: installments } = await supabase.from('installments').select('sale_id');
  const existingSaleIds = new Set(installments?.map(i => i.sale_id));

  console.log(`Encontradas ${sales.length} vendas no total.`);

  for (const sale of sales) {
    if (existingSaleIds.has(sale.id)) continue;

    console.log(`Gerando parcelas para a venda: ${sale.id.substring(0,8)}...`);
    
    const numInstallments = sale.installments || 1;
    const totalValue = sale.total_value || (sale.sale_price * sale.quantity);
    const installmentValue = parseFloat((totalValue / numInstallments).toFixed(2));
    const installmentRecords = [];

    for (let i = 1; i <= numInstallments; i++) {
      const finalValue = i === numInstallments 
        ? totalValue - (installmentValue * (numInstallments - 1))
        : installmentValue;

      // Se for venda antiga, vamos colocar o vencimento baseado na data da venda
      const dueDate = new Date(sale.created_at);
      dueDate.setDate(dueDate.getDate() + (30 * i));

      installmentRecords.push({
        sale_id: sale.id,
        user_id: sale.user_id,
        installment_number: i,
        value: finalValue,
        status: sale.status === 'pago' ? 'pago' : 'pendente',
        due_date: dueDate.toISOString(),
        paid_at: sale.status === 'pago' ? sale.created_at : null
      });
    }

    const { error: instError } = await supabase.from('installments').insert(installmentRecords);
    if (instError) console.error(`Erro na venda ${sale.id}:`, instError.message);
  }

  console.log("✅ AUTO-CURA CONCLUÍDA! Suas parcelas antigas foram restauradas.");
}

healInstallments();
