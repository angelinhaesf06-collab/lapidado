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

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-5 flex md:flex-row items-center justify-between gap-2 md:gap-4">
        
        {/* ESTRUTURA MOBILE: 3 COLUNAS IGUAIS PARA FORÇAR O CENTRO */}
        <div className="grid grid-cols-[1fr_2fr_1fr] items-center w-full md:flex md:flex-row md:justify-between md:gap-8">
          
          {/* LOGOTIPO (ESQUERDA) */}
          <Link href="/?catalogo=true" className="flex-shrink-0 group justify-self-start">
            {branding?.logo_url ? (
              <div className="relative w-20 md:w-48 h-8 md:h-14 transition-all duration-500 group-hover:scale-105">
                 <Image src={branding.logo_url} alt={branding.store_name || "Logo"} className="object-contain object-left" fill priority />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center text-white">
                  <span className="text-xs font-bold italic">{(branding?.store_name || 'L')[0]}</span>
                </div>
              </div>
            )}
          </Link>

          {/* FRASE DE IMPACTO (CENTRO REAL) */}
          {branding?.tagline && (
            <div className="px-1 text-center justify-self-center">
              <p className="text-[7px] md:text-[9px] font-black tracking-[0.1em] md:tracking-[0.4em] uppercase text-brand-primary leading-tight line-clamp-2">
                {branding.tagline}
              </p>
            </div>
          )}

          {/* SACOLA (DIREITA) */}
          <div className="flex items-center justify-self-end">
            <Link href="/cart?catalogo=true" className="group flex items-center gap-2 p-1.5 md:p-3 rounded-xl bg-brand-primary/10 hover:bg-brand-primary transition-all text-brand-primary hover:text-white">
               <div className="relative">
                 <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
                 {itemCount > 0 && (
                   <span className="absolute -top-2 -right-2 w-4 h-4 bg-brand-primary text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white shadow-md font-black animate-bounce">
                     {itemCount}
                   </span>
                 )}
               </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
