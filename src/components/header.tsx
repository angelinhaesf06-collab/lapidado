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
    warranty: string | null
  } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadBranding() {
      try {
        const { data } = await supabase.from('branding').select('*').single()
        if (data) {
          const rawTagline = data.facebook || ''
          const [tagline, installments, banner] = rawTagline.split('|')
          
          setBranding({ 
            logo_url: data.logo_url,
            tagline: tagline || null,
            topBanner: banner || null,
            warranty: data.tiktok || null // Garantia guardada na coluna tiktok
          })
        }
      } catch {
        console.error('Erro ao carregar marca na vitrine')
      }
    }
    loadBranding()
  }, [supabase])

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-brand-secondary/10 sticky top-0 z-50 flex flex-col items-center justify-center shadow-sm">
      
      {/* BANNER PERSONALIZADO - TOPO DO HEADER (COR PRIMÁRIA) */}
      {(branding as any)?.topBanner && (
        <div className="w-full bg-brand-primary py-2.5 text-center overflow-hidden shadow-inner">
           <p className="text-white text-[7px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] animate-pulse">
             ✨ {(branding as any).topBanner} ✨
           </p>
        </div>
      )}

      <div className="w-full px-4 md:px-12 py-6 md:py-10 flex flex-col items-center relative">
        
        {/* SACOLA NO CANTO SUPERIOR DIREITO - APENAS ELA AGORA */}
        <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2">
          <Link href="/cart" className="group relative p-3 md:p-5 rounded-full hover:bg-brand-secondary/5 transition-all text-brand-primary">
             <ShoppingBag className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
             {itemCount > 0 && (
               <span className="absolute top-1 right-1 w-5 h-5 bg-brand-primary text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white shadow-sm font-black animate-in zoom-in duration-300">
                 {itemCount}
               </span>
             )}
          </Link>
        </div>

        {/* LOGOTIPO EM DESTAQUE TOTAL */}
        <Link href="/" className="flex flex-col items-center text-center group w-full">
          {branding?.logo_url ? (
            <div className="w-full max-w-[300px] md:max-w-[450px] h-32 md:h-56 mb-4 md:mb-8 flex items-center justify-center transition-transform duration-700 relative">
               <Image src={branding.logo_url} alt="Logo" className="object-contain" fill priority />
            </div>
          ) : (
            <div className="w-20 h-20 md:w-32 md:h-32 mb-4 md:mb-8 rounded-full bg-brand-secondary/5 flex items-center justify-center text-brand-primary">
              <span className="text-4xl md:text-6xl font-bold">L</span>
            </div>
          )}

          {/* FRASE DE IMPACTO EM UMA ÚNICA LINHA CENTRALIZADA */}
          {branding?.tagline && (
            <div className="w-full max-w-4xl px-4">
              <p className="text-[10px] md:text-[14px] font-black tracking-[0.3em] md:tracking-[0.6em] uppercase text-brand-primary/90 leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                {branding.tagline}
              </p>
              <div className="w-16 h-[1.5px] bg-brand-secondary/40 mx-auto mt-3 group-hover:w-full transition-all duration-1000 max-w-[200px]" />
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
