'use client'

import { Gem, CheckCircle2, ShoppingBag, Loader2, Trash2, ShieldCheck, Sparkles, RefreshCcw, ExternalLink } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { purchasePlan, GOOGLE_PLAY_PLANS, syncSubscriptionWithSupabase, restorePurchases, isNative } from '../../../lib/billing/googlePlay'
import { createStripeCheckout, STRIPE_PLANS } from '@/lib/billing/stripe'
import Link from 'next/link'

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

  const handleSubscribe = async (plan: 'lite' | 'liteyearly' | 'monthly' | 'yearly') => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Usuário não autenticado.')
        return
      }

      console.log(`📱 [SubscriptionPage] Ambiente detectado: ${isNative ? 'App Nativo' : 'Browser/Web'}`);

      if (isNative) {
        console.log('📱 Usando Google Play Billing (RevenueCat)...');
        let planType: 'lite' | 'liteyearly' | 'monthly' | 'yearly';
        if (plan === 'lite') planType = GOOGLE_PLAY_PLANS.LITE;
        else if (plan === 'liteyearly') planType = GOOGLE_PLAY_PLANS.LITE_YEARLY;
        else if (plan === 'monthly') planType = GOOGLE_PLAY_PLANS.MONTHLY;
        else planType = GOOGLE_PLAY_PLANS.YEARLY;

        const purchase = await purchasePlan(planType)
        if (purchase.success && (purchase as any).purchaserInfo) {
          await syncSubscriptionWithSupabase(supabase, user.id, (purchase as any).purchaserInfo)
          window.location.reload()
        } else {
          const errorMsg = (purchase as any).error;
          if (errorMsg) {
            alert(`Erro na Google Play: ${errorMsg}`);
          }
        }
      } else {
        console.log('🌐 Usando Stripe Checkout...');
        if (plan === 'lite' || plan === 'liteyearly') {
           if (plan === 'lite') {
             alert('O plano Lite Mensal está disponível apenas no aplicativo Android via Google Play.');
             setLoading(false);
             return;
           }
           const stripePlan = STRIPE_PLANS.LITE_YEARLY;
           console.log(`🎟️ Plano selecionado: Lite Anual (${stripePlan})`);
           const checkout = await createStripeCheckout(stripePlan, user.id, user.email || '')
           if (!checkout.success) alert(`Erro no Stripe: ${checkout.error}`)
           return;
        }
        const stripePlan = plan === 'monthly' ? STRIPE_PLANS.MONTHLY : STRIPE_PLANS.YEARLY;
        console.log(`🎟️ Plano selecionado: ${plan} (${stripePlan})`);
        const checkout = await createStripeCheckout(stripePlan, user.id, user.email || '')
        if (!checkout.success) alert(`Erro no Stripe: ${checkout.error}`)
      }
    } catch (err: any) {
      console.error('❌ Erro crítico na assinatura:', err)
      alert(`Erro ao processar assinatura: ${err.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const result = await restorePurchases()
      if (result.success && result.customerInfo) {
        await syncSubscriptionWithSupabase(supabase, user.id, result.customerInfo)
        alert('Assinatura restaurada com sucesso! ✨')
        window.location.reload()
      } else {
        alert('Nenhuma assinatura ativa encontrada para esta conta do Google Play.')
      }
    } catch (err) {
      alert('Erro ao restaurar compras.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = () => {
    const isMobile = typeof window !== 'undefined' && ((window as any).Capacitor || navigator.userAgent.includes('Mobile'));
    if (isMobile) {
      window.open('https://play.google.com/store/account/subscriptions', '_blank');
    } else {
      window.open('https://wa.me/5511999999999?text=Olá, gostaria de cancelar minha assinatura do Lapidado.', '_blank');
    }
  }

  const statusColor = subscription?.subscription_status === 'active' ? 'text-green-500' : 'text-brand-secondary'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight uppercase text-brand-primary">Sua Assinatura</h2>
          <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Mantenha seu brilho sempre ativo 💎</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleRestore}
            className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-brand-secondary hover:text-brand-primary transition-colors p-2"
          >
            <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
            Restaurar Acesso
          </button>

          {subscription?.subscription_status === 'active' && (
            <button 
              onClick={handleCancelSubscription}
              className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-rose-500/50 hover:text-rose-600 transition-colors p-2"
            >
              <Trash2 size={12} />
              Excluir Assinatura
            </button>
          )}
        </div>
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
              <ShieldCheck size={20} className="text-green-600" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Assinatura Ativa</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h4 className="text-[12px] font-black text-brand-primary uppercase tracking-[0.2em] border-b border-brand-secondary/10 pb-4 mb-6 flex items-center gap-2">
                <Sparkles size={16} className="text-brand-secondary" />
                Vantagens do Seu Plano
              </h4>
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

            {/* NOTA POLÍTICA GOOGLE (OBRIGATÓRIO) */}
            <div className="pt-6 border-t border-brand-secondary/5">
               <p className="text-[8px] text-brand-secondary/50 font-medium leading-relaxed">
                 Sua assinatura será processada pela Google Play Store. A cobrança é recorrente e a renovação automática ocorre a menos que seja cancelada 24h antes do fim do período. Você pode gerenciar ou cancelar em &quot;Assinaturas&quot; na Google Play.
               </p>
               <div className="flex gap-4 mt-4">
                 <Link href="/privacidade" className="text-[8px] font-black uppercase tracking-widest text-brand-secondary hover:text-brand-primary flex items-center gap-1">
                   Privacidade <ExternalLink size={8} />
                 </Link>
                 <Link href="/termos" className="text-[8px] font-black uppercase tracking-widest text-brand-secondary hover:text-brand-primary flex items-center gap-1">
                   Termos <ExternalLink size={8} />
                 </Link>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[12px] font-black text-brand-primary uppercase tracking-[0.2em] mb-6">Mudar de Plano</h4>
            
            <div className="grid grid-cols-1 gap-4">
              {/* LITE PLANS */}
              <div className="space-y-3">
                <p className="text-[9px] font-black text-brand-secondary uppercase tracking-widest ml-2">Lite (IA + Vitrine)</p>
                <button 
                  onClick={() => handleSubscribe('lite')}
                  disabled={loading}
                  className="w-full bg-rose-50/30 p-5 rounded-3xl flex items-center justify-between group hover:scale-[1.01] transition-all border border-brand-secondary/5"
                >
                  <div className="text-left">
                    <p className="text-lg font-black text-brand-primary">R$ 49,90<span className="text-[10px] opacity-40">/mês</span></p>
                  </div>
                  {loading ? <Loader2 size={18} className="animate-spin text-brand-primary" /> : <ShoppingBag size={18} className="text-brand-primary/40" />}
                </button>

                <button 
                  onClick={() => handleSubscribe('liteyearly')}
                  disabled={loading}
                  className="w-full bg-rose-50/60 p-5 rounded-3xl flex items-center justify-between group hover:scale-[1.01] transition-all border border-brand-secondary/10"
                >
                  <div className="text-left">
                    <p className="text-lg font-black text-brand-primary">R$ 499,00<span className="text-[10px] opacity-40">/ano</span></p>
                    <p className="text-[7px] font-bold text-brand-secondary uppercase mt-0.5">Economize R$ 99,80</p>
                  </div>
                  {loading ? <Loader2 size={18} className="animate-spin text-brand-primary" /> : <Gem size={18} className="text-brand-secondary" />}
                </button>
              </div>

              {/* PRO PLANS */}
              <div className="space-y-3 mt-4">
                <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest ml-2">Pro (Completo + Financeiro)</p>
                <button 
                  onClick={() => handleSubscribe('monthly')}
                  disabled={loading}
                  className="w-full bg-white p-5 rounded-3xl flex items-center justify-between group hover:scale-[1.01] transition-all shadow-sm border border-brand-secondary/10"
                >
                  <div className="text-left">
                    <p className="text-lg font-black text-brand-primary">R$ 69,80<span className="text-[10px] opacity-40">/mês</span></p>
                  </div>
                  {loading ? <Loader2 size={18} className="animate-spin text-brand-primary" /> : <ShoppingBag size={18} className="text-brand-primary" />}
                </button>

                <button 
                  onClick={() => handleSubscribe('yearly')}
                  disabled={loading}
                  className="w-full bg-brand-primary p-6 rounded-[32px] flex items-center justify-between group hover:scale-[1.01] transition-all shadow-xl"
                >
                  <div className="text-left text-white">
                    <p className="text-xl font-black">R$ 710,00<span className="text-[10px] opacity-40">/ano</span></p>
                    <p className="text-[7px] font-bold text-white/40 uppercase mt-0.5">Economize R$ 127,60</p>
                  </div>
                  {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <Gem size={20} className="text-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 💎 NEXUS: CONFORMIDADE GOOGLE PLAY - ACESSO RÁPIDO À EXCLUSÃO */}
        <div className="mt-16 pt-12 border-t border-rose-100/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-rose-50/20 p-8 rounded-[40px] border border-rose-100/30">
            <div className="text-center md:text-left">
              <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-2">Gestão de Dados</h4>
              <p className="text-xs text-brand-primary/60 font-medium">Deseja encerrar sua conta e apagar todos os seus dados permanentemente?</p>
            </div>
            <Link 
              href="/excluir-conta"
              className="px-8 py-4 bg-white border border-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center gap-2 group"
            >
              <Trash2 size={14} className="group-hover:animate-bounce" />
              Excluir Minha Conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
