'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function Header() {
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
        <Link href="/" className="flex items-center group">
          {branding?.logo_url ? (
            <div className="relative w-32 md:w-48 h-10 md:h-14 transition-transform duration-500 hover:scale-105">
               <Image src={branding.logo_url} alt="Logo" className="object-contain object-left" fill priority />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-primary flex items-center justify-center text-white">
                <span className="text-sm md:text-lg font-bold italic">L</span>
              </div>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-brand-primary">Lapidado</span>
            </div>
          )}
        </Link>

        {/* FRASE DE IMPACTO (CENTRO - ESCONDIDA NO MOBILE PARA GANHAR ESPAÇO) */}
        {branding?.tagline && (
          <div className="hidden lg:block flex-1 px-8 text-center">
            <p className="text-[9px] font-black tracking-[0.4em] uppercase text-brand-primary/70 leading-none">
              {branding.tagline}
            </p>
          </div>
        )}

        {/* SACOLA E ACESSO (DIREITA) */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/login" className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary/60 hover:text-brand-primary transition-colors">
            <User size={16} strokeWidth={1.5} />
            Minha Conta
          </Link>
          <Link href="/cart" className="group relative p-2 md:p-3 rounded-full hover:bg-brand-secondary/5 transition-all text-brand-primary">
             <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
             <span className="absolute top-0 right-0 w-4 h-4 bg-brand-primary text-white text-[8px] flex items-center justify-center rounded-full border border-white shadow-sm font-black">!</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
