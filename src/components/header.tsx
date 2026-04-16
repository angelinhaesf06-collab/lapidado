'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useCart } from '@/lib/cart-context'

export default function Header() {
  const { itemCount } = useCart()
  const [branding, setBranding] = useState<{
    logo_url: string | null, 
    tagline: string | null,
    topBanner: string | null,
    warranty: string | null,
    store_name: string | null
  } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadBranding() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        let brandingData = null

        if (user) {
          const { data: userBranding } = await supabase.from('branding').select('*').eq('user_id', user.id).limit(1).maybeSingle()
          brandingData = userBranding
        }
        
        if (!brandingData) {
          const { data: orphanedBranding } = await supabase.from('branding').select('*').is('user_id', null).limit(1).maybeSingle()
          brandingData = orphanedBranding
        }

        if (!brandingData) {
          const { data: anyBranding } = await supabase.from('branding').select('*').limit(1).maybeSingle()
          brandingData = anyBranding
        }

        if (brandingData) {
          const rawTagline = brandingData.facebook || ''
          const [tagline, installments, banner] = rawTagline.split('|')
          
          setBranding({ 
            logo_url: brandingData.logo_url,
            tagline: tagline || null,
            topBanner: banner || null,
            warranty: brandingData.tiktok || null,
            store_name: brandingData.store_name || 'LAPIDADO'
          })
        }
      } catch {
        console.error('Erro ao carregar marca na vitrine')
      }
    }
    loadBranding()
  }, [supabase])

  return (
    <header className="bg-brand-primary/5 backdrop-blur-xl border-b border-brand-primary/10 sticky top-0 z-50 shadow-sm transition-all duration-700">
      
      {/* BANNER MINIMALISTA (DNA CROMÁTICO) */}
      {(branding as any)?.topBanner && (
        <div className="w-full bg-brand-primary py-1.5 text-center overflow-hidden shadow-inner">
           <p className="text-white text-[7px] md:text-[9px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] animate-pulse">
             ✨ {(branding as any).topBanner} ✨
           </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-5 flex items-center justify-between gap-2">
        
        {/* LOGOTIPO COMPACTO (ESQUERDA) */}
        <Link href="/?catalogo=true" className="flex-shrink-0 group">
          {branding?.logo_url ? (
            <div className="relative w-24 md:w-48 h-8 md:h-14 transition-all duration-500 group-hover:scale-105">
               <Image src={branding.logo_url} alt={branding.store_name || "Logo"} className="object-contain object-left" fill priority />
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                <span className="text-xs md:text-lg font-bold italic">{(branding?.store_name || 'L')[0]}</span>
              </div>
              <span className="text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-primary">{branding?.store_name || 'Lapidado'}</span>
            </div>
          )}
        </Link>

        {/* FRASE DE IMPACTO (CENTRALIZADA E FLEXÍVEL) */}
        {branding?.tagline && (
          <div className="flex-1 px-1 md:px-8 text-center animate-in fade-in duration-1000">
            <p className="text-[6px] md:text-[9px] font-black tracking-[0.1em] md:tracking-[0.4em] uppercase text-brand-primary leading-tight text-center line-clamp-2">
              {branding.tagline}
            </p>
          </div>
        )}

        {/* SACOLA (DIREITA - DNA CROMÁTICO) */}
        <div className="flex-shrink-0 flex items-center gap-1 md:gap-4">
          <Link href="/cart?catalogo=true" className="group flex items-center gap-2 p-2 md:p-3 rounded-2xl bg-brand-primary/10 hover:bg-brand-primary transition-all text-brand-primary hover:text-white">
             <div className="relative">
               <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
               {itemCount > 0 && (
                 <span className="absolute -top-2 -right-2 w-4 h-4 bg-brand-primary text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white shadow-md font-black group-hover:bg-white group-hover:text-brand-primary transition-colors animate-bounce">
                   {itemCount}
                 </span>
               )}
             </div>
             <span className="hidden md:block text-[9px] font-black uppercase tracking-[0.2em]">Sua Sacola</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
