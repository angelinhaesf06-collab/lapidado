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
    <header className="bg-white/95 backdrop-blur-md border-b border-brand-secondary/10 sticky top-0 z-50 shadow-sm">
      
      {/* BANNER MINIMALISTA (Opcional, se houver banner, fica bem fino) */}
      {(branding as any)?.topBanner && (
        <div className="w-full bg-brand-primary py-1 text-center overflow-hidden">
           <p className="text-white text-[7px] md:text-[9px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em]">
             ✨ {(branding as any).topBanner} ✨
           </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
        
        {/* LOGOTIPO COMPACTO (ESQUERDA) */}
        <Link href="/?catalogo=true" className="flex items-center group">
          {branding?.logo_url ? (
            <div className="relative w-32 md:w-48 h-10 md:h-14 transition-transform duration-500 hover:scale-105">
               <Image src={branding.logo_url} alt={branding.store_name || "Logo"} className="object-contain object-left" fill priority />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-primary flex items-center justify-center text-white">
                <span className="text-sm md:text-lg font-bold italic">{(branding?.store_name || 'L')[0]}</span>
              </div>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-brand-primary">{branding?.store_name || 'Lapidado'}</span>
            </div>
          )}
        </Link>

        {/* FRASE DE IMPACTO (CENTRO - AGORA VISÍVEL EM TODOS OS DISPOSITIVOS) */}
        {branding?.tagline && (
          <div className="flex-1 px-2 md:px-8 text-center">
            <p className="text-[6px] md:text-[9px] font-black tracking-[0.2em] md:tracking-[0.4em] uppercase text-brand-primary/70 leading-tight md:leading-none line-clamp-2 md:line-clamp-none">
              {branding.tagline}
            </p>
          </div>
        )}

        {/* SACOLA (DIREITA) */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/cart?catalogo=true" className="group flex items-center gap-2 p-2 md:p-3 rounded-full hover:bg-brand-secondary/5 transition-all text-brand-primary">
             <div className="relative">
               <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
               {itemCount > 0 && (
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white text-[8px] flex items-center justify-center rounded-full border border-white shadow-sm font-black animate-in zoom-in duration-300">
                   {itemCount}
                 </span>
               )}
             </div>
             <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em]">Sacola</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
