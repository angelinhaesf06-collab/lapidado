'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, ShoppingCart, Package, Gem, PlusCircle, LayoutDashboard, LogOut, ExternalLink, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [branding, setBranding] = useState<{name: string, logo: string | null}>({name: 'LAPIDADO', logo: null})
  const supabase = createClient()

  useEffect(() => {
    async function loadBranding() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('branding')
          .select('store_name, business_name, logo_url, facebook')
          .eq('user_id', user.id)
          .single()
        
        if (data) {
          const [tagline, installments, banner, bName] = (data.facebook || '').split('|')
          setBranding({
            name: data.business_name || data.store_name || bName || 'LAPIDADO',
            logo: data.logo_url || null
          })
        }
      }
    }
    loadBranding()
  }, [supabase])

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Vendas', href: '/admin/sales', icon: ShoppingCart },
    { name: 'Minha Marca', href: '/admin/branding', icon: Gem },
    { name: 'Categorias', href: '/admin/categories', icon: Package },
    { name: 'Produtos', href: '/admin/products', icon: Package },
    { name: 'Nova Peça', href: '/admin/products/new', icon: PlusCircle },
  ]

  const shareToWhatsApp = () => {
    const url = `${window.location.origin}/?catalogo=true`
    const text = `Olá! Conheça o novo catálogo digital da *${branding.name}*. Peças exclusivas e brilho em cada detalhe: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="flex min-h-screen bg-[#fffcfc]">
      
      {/* 💎 SIDEBAR LAPIDADO (ESQUERDA) */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-brand-secondary/10 p-8 sticky top-0 h-screen z-50 shadow-[20px_0_40px_rgba(74,50,46,0.02)]">
        
        {/* LOGO NO TOPO DA SIDEBAR */}
        <div className="flex flex-col items-center gap-4 mb-16 px-2 text-center">
          {branding.logo ? (
            <div className="relative w-full h-16 mb-2">
              <Image src={branding.logo} alt="Logo" className="object-contain" fill />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 mb-2">
              <Gem size={22} />
            </div>
          )}
          <div>
            <h1 className="text-[12px] font-black uppercase tracking-[0.4em] text-brand-primary leading-none">{branding.name}</h1>
            <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-brand-secondary mt-1">Gestão Empresarial</p>
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
                className={`flex items-center gap-4 px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 group ${
                  isActive 
                  ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20 translate-x-2' 
                  : 'text-brand-secondary/60 hover:bg-brand-secondary/5 hover:text-brand-primary'
                }`}
              >
                <item.icon size={20} className={`${isActive ? 'text-white' : 'text-brand-secondary/40 group-hover:text-brand-primary'}`} /> 
                {item.name}
              </Link>
            )
          })}

          <div className="pt-8 space-y-3">
             <h4 className="text-[8px] font-black text-brand-secondary/40 uppercase tracking-[0.3em] ml-6 mb-2">Acesso Rápido</h4>
             
             <Link 
                href="/?catalogo=true" 
                target="_blank"
                className="flex items-center gap-4 px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary bg-brand-secondary/10 hover:bg-brand-secondary/20 transition-all border border-brand-secondary/10"
              >
                <ExternalLink size={20} className="text-brand-primary" /> 
                Ver Vitrine
              </Link>

              <button 
                onClick={shareToWhatsApp}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-white bg-[#25D366] hover:bg-[#128C7E] transition-all shadow-lg shadow-green-500/20"
              >
                <Share2 size={20} /> 
                Divulgar Whats
              </button>
          </div>
        </nav>

        {/* RODAPÉ DA SIDEBAR */}
        <div className="pt-8 border-t border-brand-secondary/10">
           <Link href="/login" className="flex items-center gap-4 px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/40 hover:text-rose-500 transition-all">
              <LogOut size={20} /> Sair do Painel
           </Link>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 w-full overflow-x-hidden">
        {/* BARRA SUPERIOR MOBILE (Apenas telas pequenas) */}
        <div className="md:hidden bg-white border-b border-brand-secondary/10 p-4 flex justify-between items-center sticky top-0 z-50">
           <div className="flex items-center gap-3">
             <Gem size={20} className="text-brand-primary" />
             <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{branding.name}</span>
           </div>
           
           <div className="flex gap-2">
             <Link href="/?catalogo=true" target="_blank" className="p-2 bg-brand-secondary/10 rounded-full text-brand-primary">
                <ExternalLink size={18} />
             </Link>
             <button onClick={shareToWhatsApp} className="p-2 bg-[#25D366] rounded-full text-white">
                <Share2 size={18} />
             </button>
           </div>
        </div>

        <div className="px-4 py-8 md:px-12 md:py-16">
          {children}
        </div>
      </main>
    </div>
  )
}
