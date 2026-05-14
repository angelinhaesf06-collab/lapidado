/**
 * 💎 NEXUS: STRIPE BILLING SERVICE
 * Este serviço gerencia a criação de sessões de checkout do Stripe.
 */

export const STRIPE_PLANS = {
  // 💎 NEXUS: Prioridade total para as variáveis da Vercel
  LITE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_LITE_MONTHLY_PRICE_ID || 'price_lite_monthly_placeholder',
  LITE_YEARLY: process.env.NEXT_PUBLIC_STRIPE_LITE_YEARLY_PRICE_ID || 'price_lite_yearly_placeholder',
  MONTHLY: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_1TTplZHVcB5HCb50xUb7f9IX',
  YEARLY: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_1TTptoHVcB5HCb50qvX9qUdS'
}

export async function createStripeCheckout(planId: string, userId: string, userEmail: string) {
  try {
    console.log(`🛒 Iniciando checkout Stripe para o plano: ${planId}`)
    console.log(`👤 Usuário: ${userId} (${userEmail})`)
    
    // Alerta temporário para diagnóstico no frontend
    // alert(`Iniciando Stripe: ${planId}`);

    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: planId,
        userId: userId,
        userEmail: userEmail
      })
    })

    console.log(`📡 Resposta da API de checkout: status ${response.status}`)
    const data = await response.json()
    console.log(`📦 Dados recebidos da API:`, data)
    
    if (data.url) {
      console.log(`🚀 Redirecionando para: ${data.url}`)
      window.location.href = data.url
      return { success: true }
    }
    
    throw new Error(data.error || 'Falha ao gerar link de pagamento no Stripe')
  } catch (error: any) {
    console.error('❌ Erro no checkout Stripe:', error)
    return { success: false, error: error.message }
  }
}
