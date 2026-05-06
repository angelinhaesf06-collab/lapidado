/**
 * 💎 NEXUS: STRIPE BILLING SERVICE
 * Este serviço gerencia a criação de sessões de checkout do Stripe.
 */

export const STRIPE_PLANS = {
  // 💎 NEXUS: Prioridade total para as variáveis da Vercel mostradas no print
  MONTHLY: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_1TTplZHVcB5HCb50xUb7f9IX',
  YEARLY: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_1TTptoHVcB5HCb50qvX9qUdS'
}

export async function createStripeCheckout(planId: string, userId: string, userEmail: string) {
  try {
    console.log(`🛒 Iniciando checkout Stripe: ${planId}`)
    
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: planId,
        userId: userId,
        userEmail: userEmail
      })
    })

    const data = await response.json()
    
    if (data.url) {
      window.location.href = data.url
      return { success: true }
    }
    
    throw new Error(data.error || 'Falha ao gerar link de pagamento')
  } catch (error: any) {
    console.error('❌ Erro no checkout Stripe:', error)
    return { success: false, error: error.message }
  }
}
