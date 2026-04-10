'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
            tagline: data.facebook || null
          })
        }
      } catch (e) {
        console.error('Erro ao carregar marca na vitrine')
      }
    }
    loadBranding()
  }, [])

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-rose-50 sticky top-0 z-50 py-6 md:py-12 flex flex-col items-center justify-center shadow-sm min-h-[180px] md:min-h-[280px]">
      <div className="max-w-7xl w-full px-4 md:px-8 grid grid-cols-3 items-center">
        
        {/* Lado Esquerdo - Vazio para equilíbrio */}
        <div className="flex-1"></div>

        {/* Centro - Logotipo Responsivo */}
        <Link href="/" className="flex flex-col items-center text-center group">
          {branding?.logo_url ? (
            <div className="w-32 h-32 md:w-48 md:h-48 mb-4 md:mb-8 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
               <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-8 rounded-full bg-rose-50 flex items-center justify-center text-brand-primary">
              <span className="font-glamour text-3xl md:text-4xl font-bold">L</span>
            </div>
          )}

          {branding?.tagline && (
            <p className="text-[8px] md:text-[11px] font-light tracking-[0.4em] md:tracking-[0.7em] uppercase text-brand-secondary italic px-2">
              {branding.tagline}
            </p>
          )}
          
          <div className="w-8 h-[1px] bg-brand-secondary/20 mt-4 group-hover:w-20 transition-all duration-1000 hidden md:block" />
        </Link>

        {/* Lado Direito - Ações Mobile-Friendly */}
        <div className="flex justify-end gap-2 md:gap-6 items-center">
          <Link href="/cart" className="group relative p-3 md:p-4 rounded-full hover:bg-rose-50/50 transition-all text-brand-primary">
             <ShoppingBag size={24} md:size={28} strokeWidth={1.5} />
             <span className="absolute top-1 right-1 w-5 h-5 bg-brand-primary text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">!</span>
          </Link>
          
          <Link href="/admin" className="p-3 md:p-4 rounded-full hover:bg-rose-50/50 transition-all text-brand-primary/30">
             <User size={20} md:size={24} strokeWidth={1.5} />
          </Link>
        </div>

      </div>
    </header>
  )
}
