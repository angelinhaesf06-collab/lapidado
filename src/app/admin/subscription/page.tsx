'use client'

import { Gem, CheckCircle2, ShoppingBag, Loader2 } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { purchasePlan, GOOGLE_PLAY_PLANS, syncSubscriptionWithSupabase } from '../../../lib/billing/googlePlay'
import { createStripeCheckout, STRIPE_PLANS } from '@/lib/billing/stripe'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<{
    subscription_status: string;
    trial_ends_at: string | null;
    google_play_subscription_id: string | null;
  } | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('branding')
          .select('subscription_status, trial_ends_at, google_play_subscription_id')
          .eq('user_id', user.id)
          .maybeSingle()
        setSubscription(data)
      }
    }
    loadSubscription()
  }, [supabase])

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const isMobile = typeof window !== 'undefined' && ((window as any).Capacitor || navigator.userAgent.includes('Mobile'));

      if (isMobile) {
        const planType: 'monthly' | 'yearly' = plan === 'monthly' ? GOOGLE_PLAY_PLANS.MONTHLY : GOOGLE_PLAY_PLANS.YEARLY;
        const purchase = await purchasePlan(planType)
        if (purchase.success && purchase.purchaserInfo) {
          await syncSubscriptionWithSupabase(supabase, user.id, purchase.purchaserInfo)
          window.location.reload()
        }
      } else {
        const stripePlan = plan === 'monthly' ? STRIPE_PLANS.MONTHLY : STRIPE_PLANS.YEARLY;
        const checkout = await createStripeCheckout(stripePlan, user.id, user.email || '')
        if (!checkout.success) alert(checkout.error)
      }
    } catch (err) {
      console.error('Erro na assinatura:', err)
      alert('Erro ao processar assinatura.')
    } finally {
      setLoading(false)
    }
  }

  const statusColor = subscription?.subscription_status === 'active' ? 'text-green-500' : 'text-brand-secondary'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl font-bold tracking-tight uppercase text-brand-primary">Sua Assinatura</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Mantenha seu brilho sempre ativo 💎</p>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[50px] border border-brand-secondary/10 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-1">Status Atual</p>
            <h3 className={`text-2xl font-black uppercase tracking-tight ${statusColor}`}>
              {subscription?.subscription_status === 'active' ? 'Plano Pro Ativo' : 'Período de Teste / Inativo'}
            </h3>
          </div>
          {subscription?.subscription_status === 'active' && (
            <div className="bg-green-50 px-6 py-3 rounded-full flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-600" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Acesso Vitalício Garantido</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-[12px] font-black text-brand-primary uppercase tracking-[0.2em] border-b border-brand-secondary/10 pb-4">Benefícios Pro</h4>
            <ul className="space-y-4">
              {[
                'Produtos e Estoque ilimitados',
                'IA Gemini 3.1 Flash para descrições',
                'DNA Cromático via Logotipo',
                'Gestão Financeira e Vendas',
                'Exportação de Romaneios em PDF',
                'Suporte Prioritário'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-brand-secondary" />
                  <span className="text-sm font-medium text-brand-primary/70">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-rose-50/30 p-8 rounded-[40px] border border-brand-secondary/5">
            <h4 className="text-[12px] font-black text-brand-primary uppercase tracking-[0.2em] mb-6">Mudar de Plano</h4>
            <div className="space-y-4">
              <button 
                onClick={() => handleSubscribe('monthly')}
                disabled={loading}
                className="w-full bg-white p-6 rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all shadow-sm border border-brand-secondary/10"
              >
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase text-brand-secondary opacity-60">Mensal</p>
                  <p className="text-lg font-black text-brand-primary">R$ 69,80</p>
                </div>
                {loading ? <Loader2 size={20} className="animate-spin text-brand-primary" /> : <ShoppingBag size={20} className="text-brand-primary" />}
              </button>

              <button 
                onClick={() => handleSubscribe('yearly')}
                disabled={loading}
                className="w-full bg-brand-primary p-6 rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl"
              >
                <div className="text-left text-white">
                  <p className="text-[8px] font-black uppercase text-brand-secondary">Anual (Melhor Valor)</p>
                  <p className="text-lg font-black">R$ 710,00</p>
                </div>
                {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <Gem size={20} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
