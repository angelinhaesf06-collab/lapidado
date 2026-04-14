'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function Header() {
  const [branding, setBranding] = useState<{logo_url: string | null, tagline: string | null} | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadBranding() {
      try {
        const { data } = await supabase.from('branding').select('*').single()
        if (data) {
          setBranding({ 
            logo_url: data.logo_url,
            tagline: data.business_name || null // Agora a tagline é o business_name
          })
        }
      } catch {
        console.error('Erro ao carregar marca na vitrine')
      }
    }
    loadBranding()
  }, [supabase])

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-rose-50 sticky top-0 z-50 py-6 md:py-12 flex flex-col items-center justify-center shadow-sm min-h-[180px] md:min-h-[280px]">
      <div className="max-w-7xl w-full px-4 md:px-8 grid grid-cols-3 items-center">
        
        {/* Lado Esquerdo - Vazio para equilíbrio */}
        <div className="flex-1"></div>

        {/* Centro - Logotipo Imperial */}
        <Link href="/" className="flex flex-col items-center text-center group">
          {branding?.logo_url ? (
            <div className="w-40 h-40 md:w-64 md:h-64 mb-6 md:mb-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-700 drop-shadow-xl relative">
               <Image src={branding.logo_url} alt="Logo" className="object-contain" fill />
            </div>
          ) : (
            <div className="w-20 h-20 md:w-32 md:h-32 mb-6 md:mb-10 rounded-full bg-rose-50 flex items-center justify-center text-brand-primary">
              <span className="font-glamour text-4xl md:text-6xl font-bold italic">L</span>
            </div>
          )}

          {branding?.tagline && (
            <div className="space-y-2">
              <p className="text-[9px] md:text-[13px] font-black tracking-[0.5em] md:tracking-[0.8em] uppercase text-brand-primary/80 px-4 max-w-lg leading-relaxed">
                {branding.tagline}
              </p>
              <div className="w-12 h-[1px] bg-brand-secondary/30 mx-auto group-hover:w-32 transition-all duration-1000" />
            </div>
          )}
        </Link>

        {/* Lado Direito - Ações Mobile-Friendly */}
        <div className="flex justify-end gap-2 md:gap-6 items-center">
          <Link href="/cart" className="group relative p-3 md:p-4 rounded-full hover:bg-rose-50/50 transition-all text-brand-primary">
             <ShoppingBag className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.5} />
             <span className="absolute top-1 right-1 w-5 h-5 bg-brand-primary text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">!</span>
          </Link>
          
          <Link href="/admin" className="p-3 md:p-4 rounded-full hover:bg-rose-50/50 transition-all text-brand-primary/30">
             <User className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
          </Link>
        </div>

      </div>
    </header>
  )
}
