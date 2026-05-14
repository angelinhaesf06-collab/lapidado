'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Package, Gem, PlusCircle, LayoutDashboard, LogOut, ExternalLink, Share2, Coins, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import Image from 'next/image'
import Paywall from '@/components/Paywall'
import { purchasePlan, GOOGLE_PLAY_PLANS, syncSubscriptionWithSupabase, isNative } from '../../lib/billing/googlePlay'
import { createStripeCheckout, STRIPE_PLANS } from '@/lib/billing/stripe'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [branding, setBranding] = useState<{name: string, logo: string | null, slug: string | null, website: string | null}>({name: 'LAPIDADO', logo: null, slug: null, website: null})
  const [subscription, setSubscription] = useState<{status: string, trial_ends_at: string | null} | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // 💎 NEXUS: Busca ultra-resiliente com múltiplos fallbacks de ordenação.
        const { data, error } = await supabase.from('branding')
          .select('store_name, business_name, logo_url, facebook, slug, website, subscription_status, trial_ends_at, top_banner, tagline')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (error) console.error('❌ Erro ao buscar branding:', error.message)

        if (data) {
          // 💎 NEXUS: Prioridade para store_name (personalizado) sobre business_name (padrão)
          const storeName = data.store_name || data.business_name || (data.facebook || '').split('|')[3] || 'LAPIDADO'
          const storeSlug = data.slug || generateSlug(storeName)
          
          // 💎 NEXUS: Anti-cache para o logotipo. Adiciona um timestamp na URL se ela existir.
          const logoUrl = data.logo_url ? `${data.logo_url}${data.logo_url.includes('?') ? '&' : '?'}t=${Date.now()}` : null;

          setBranding({
            name: storeName,
            logo: logoUrl,
            slug: storeSlug,
            website: data.website || null
          })
          setSubscription({
            status: data.subscription_status || 'trial',
            trial_ends_at: data.trial_ends_at || null
          })
        }
      }
    } catch (err) {
      console.error('❌ Falha crítica no loadData:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()
    
    // 💎 NEXUS: Listener para sincronizar quando a aba "Minha Marca" salvar algo
    if (typeof window !== 'undefined') {
      window.addEventListener('brandingUpdated', loadData)
      return () => window.removeEventListener('brandingUpdated', loadData)
    }
  }, [loadData])

  const isBlocked = useMemo(() => {
    if (loading || !subscription) return false;

    // ✅ Se estiver no App Nativo (Android/iOS), libera o acesso para os testadores do Google
    if (isNative) return false;

    // ✅ Plano Ativo: Acesso liberado em qualquer plataforma
    if (subscription?.status === 'active') return false;

    // ❌ Bloqueio Total para WEB (Tráfego Pago): Se não estiver ativo, bloqueia
    return true;
  }, [subscription, loading]);

  const trialDaysLeft = useMemo(() => {
    if (!subscription?.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(subscription.trial_ends_at);
    const diff = trialEnd.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, [subscription]);

  const handleSubscribe = async (plan: 'lite' | 'liteyearly' | 'monthly' | 'yearly') => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Usuário não autenticado.')
        return
      }

      console.log(`📱 Ambiente detectado: ${isNative ? 'App Nativo' : 'Browser/Web'}`);

      if (isNative) {
        console.log('📱 Usando Google Play Billing (RevenueCat)...');
        let planType: 'lite' | 'liteyearly' | 'monthly' | 'yearly';
        if (plan === 'lite') planType = GOOGLE_PLAY_PLANS.LITE;
        else if (plan === 'liteyearly') planType = GOOGLE_PLAY_PLANS.LITE_YEARLY;
        else if (plan === 'monthly') planType = GOOGLE_PLAY_PLANS.MONTHLY;
        else planType = GOOGLE_PLAY_PLANS.YEARLY;

        const purchase = await purchasePlan(planType)
        if (purchase.success && purchase.purchaserInfo) {
          await syncSubscriptionWithSupabase(supabase, user.id, purchase.purchaserInfo)
          window.location.reload()
        } else {
          const errorMsg = (purchase as any).error;
          if (errorMsg) {
            alert(`Erro na Google Play: ${errorMsg}`);
          }
        }
      } else {
        console.log('🌐 Usando Stripe Checkout...');
        let stripePlan = '';
        if (plan === 'lite') stripePlan = STRIPE_PLANS.LITE_MONTHLY;
        else if (plan === 'liteyearly') stripePlan = STRIPE_PLANS.LITE_YEARLY;
        else if (plan === 'monthly') stripePlan = STRIPE_PLANS.MONTHLY;
        else stripePlan = STRIPE_PLANS.YEARLY;

        console.log(`🎟️ Plano selecionado: ${plan} (${stripePlan})`);
        const checkout = await createStripeCheckout(stripePlan, user.id, user.email || '')
        if (!checkout.success) alert(`Erro no Stripe: ${checkout.error}`)
      }
    } catch (err: any) {
      console.error('❌ Erro crítico ao processar assinatura:', err)
      alert(`Erro ao processar assinatura: ${err.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Vendas', href: '/admin/sales', icon: ShoppingCart },
    { name: 'Clientes', href: '/admin/customers', icon: Package },
    { name: 'Minha Marca', href: '/admin/branding', icon: Gem },
    { name: 'Categorias', href: '/admin/categories', icon: Package },
    { name: 'Produtos', href: '/admin/products', icon: Package },
    { name: 'Nova Peça', href: '/admin/products/new', icon: PlusCircle },
    { name: 'Precificação', href: '/admin/pricing', icon: Coins },
    { name: 'Assinatura', href: '/admin/subscription', icon: Gem },
    { name: 'Ajuda', href: '/admin/help', icon: ExternalLink },
    { name: 'Políticas', href: '/admin/policies', icon: Package },
  ]

  const shareToWhatsApp = () => {
    // 🔗 Prioriza o link oficial cadastrado, depois a URL de ambiente, por fim a origem atual
    const baseUrl = branding.website || process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    
    // 💎 NEXUS: Fallback total para garantir que o botão NUNCA falhe se houver um nome
    const storeName = branding.name || 'LAPIDADO'
    const finalSlug = branding.slug || storeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

    const url = `${baseUrl}/?catalogo=true&loja=${finalSlug}`
    const text = `💎 *${storeName.toUpperCase()}* | Catálogo Exclusivo\n\nOlá! Confira as nossas novidades e peças selecionadas em nossa vitrine digital. Brilho e requinte a apenas um toque:\n\n🔗 ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-[100svh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-brand-secondary" size={40} />
        <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Validando Acesso...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100svh] overflow-hidden">
      
      {/* 🛑 PAYWALL DE BLOQUEIO */}
      {isBlocked && <Paywall onSubscribe={handleSubscribe as any} trialDaysLeft={trialDaysLeft} />}

      {/* 💎 BARRA DE PROGRESSO NO TOPO (Feedback Instantâneo) */}
      <style jsx global>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .route-transition-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, #4a322e, #c99090);
          z-index: 9999;
          animation: loadingBar 2s ease-out;
        }
      `}</style>

      {/* 💎 SIDEBAR LAPIDADO (ESQUERDA) */}
      <aside className="hidden md:flex w-72 flex-col bg-[#F5F0E6] border-r border-brand-secondary/10 p-8 sticky top-0 h-[100svh] z-50 shadow-[20px_0_40px_rgba(74,50,46,0.02)] overflow-y-auto scrollbar-hide">
        
        {/* LOGO DINÂMICA DO LOJISTA (MULTI-MARCAS) */}
        <div className="flex flex-col items-center gap-4 mb-16 px-2 text-center">
          {branding.logo ? (
            <div className="relative w-full h-16 mb-2">
              <Image 
                src={branding.logo} 
                alt={branding.name} 
                fill
                className="object-contain" 
              />
            </div>
          ) : (
            <div className="relative w-12 h-12 mb-2">
              <Image 
                src="/logo-app.png" 
                alt="Lapidado Logo" 
                fill
                className="object-contain rounded-xl" 
              />
            </div>
          )}
          <div>
            <h1 className="text-[12px] font-black uppercase tracking-[0.4em] text-brand-primary leading-none">{branding.name}</h1>
            <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-brand-secondary mt-1">Gestão Empresarial</p>
          </div>
        </div>
        
        {/* NAVEGAÇÃO */}
        <nav className="space-y-3 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.name}
                href={item.href} 
                prefetch={true}
                className={`flex items-center gap-4 px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-[transform,background-color,color,shadow] duration-300 group active:scale-95 transform-gpu ${
                  isActive 
                  ? 'bg-brand-primary text-white shadow-lg sm:shadow-xl shadow-brand-primary/20 translate-x-2' 
                  : 'text-brand-secondary/60 hover:bg-brand-secondary/5 hover:text-brand-primary'
                }`}
              >
                <item.icon size={20} className={`${isActive ? 'text-white' : 'text-brand-secondary/40 group-hover:text-brand-primary'} transition-colors duration-300`} /> 
                {item.name}
              </Link>
            )
          })}

          <div className="pt-8 space-y-3">
             <h4 className="text-[8px] font-black text-brand-secondary/40 uppercase tracking-[0.3em] ml-6 mb-2">Acesso Rápido</h4>
             
             <Link 
                href="/?catalogo=true" 
                target="_blank"
                className="flex items-center gap-4 px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary bg-brand-secondary/10 hover:bg-brand-secondary/20 transition-[background-color] border border-brand-secondary/10 active:scale-95"
              >
                <ExternalLink size={20} className="text-brand-primary" /> 
                Ver Vitrine
              </Link>

              <button 
                onClick={shareToWhatsApp}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-em text-white bg-[#25D366] hover:bg-[#128C7E] transition-[background-color,transform] shadow-lg shadow-green-500/20 active:scale-95"
              >
                <Share2 size={20} /> 
                Divulgar Whats
              </button>
          </div>
        </nav>

        {/* RODAPÉ DA SIDEBAR */}
        <div className="pt-8 border-t border-brand-secondary/10">
           <button 
             onClick={handleSignOut}
             className="w-full flex items-center gap-4 px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/40 hover:text-rose-500 transition-colors active:scale-95"
           >
              <LogOut size={20} /> Sair do Painel
           </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden scroll-smooth pb-[env(safe-area-inset-bottom,24px)]">
        {/* BARRA SUPERIOR MOBILE (Ajustada com todas as abas) */}
        <div className="md:hidden bg-[#F5F0E6] border-b border-brand-secondary/10 sticky top-0 z-50 shadow-sm pt-[env(safe-area-inset-top,0px)]">
           <div className="p-4 flex justify-between items-center border-b border-brand-secondary/5">
             <div className="flex items-center gap-2">
               <div className="relative w-6 h-6">
                 <Image 
                   src="/logo-app.png" 
                   alt="Logo" 
                   fill
                   className="object-contain rounded-md" 
                 />
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary">{branding.name}</span>
             </div>
             
             <div className="flex gap-2">
               <Link href="/?catalogo=true" target="_blank" className="flex items-center gap-2 px-3 py-1.5 bg-brand-secondary/10 rounded-full text-brand-primary active:scale-90 transition-all">
                  <ExternalLink size={14} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Sua Vitrine</span>
               </Link>
               <button onClick={shareToWhatsApp} className="p-1.5 bg-[#25D366] rounded-full text-white active:scale-90 transition-transform">
                  <Share2 size={14} />
               </button>
             </div>
           </div>

           {/* 📱 GRADE DE ABAS RÁPIDAS MOBILE */}
           <nav className="grid grid-cols-3 gap-1.5 p-3 bg-rose-50/20">
             {navItems.map((item) => {
               const isActive = pathname === item.href
               return (
                 <Link 
                   key={item.name}
                   href={item.href} 
                   prefetch={true}
                   className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl text-[7px] font-black uppercase tracking-tighter transition-[transform,background-color,border-color,color] border active:scale-90 duration-200 transform-gpu ${
                     isActive 
                     ? 'bg-brand-primary text-white border-brand-primary shadow-md scale-[1.02]' 
                     : 'bg-white text-brand-secondary/60 border-brand-secondary/5 hover:text-brand-primary'
                   }`}
                 >
                   <item.icon size={14} />
                   <span className="text-center leading-none">{item.name}</span>
                 </Link>
               )
             })}
             
             {/* BOTÃO SAIR MOBILE */}
             <button 
               onClick={handleSignOut}
               className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl text-[7px] font-black uppercase tracking-tighter transition-[transform,background-color] border bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 active:scale-90"
             >
               <LogOut size={14} />
               <span className="text-center leading-none">Sair</span>
             </button>
           </nav>
        </div>

        <div className="px-4 py-8 md:px-12 md:py-16 animate-in fade-in duration-500 slide-in-from-bottom-2 transform-gpu">
          {children}
        </div>
      </main>
    </div>
  )
}
