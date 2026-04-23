'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
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
        const urlParams = new URLSearchParams(window.location.search)
        const storeSlug = urlParams.get('loja')
        const isPublic = urlParams.get('catalogo') === 'true'

        let brandingData = null

        // 1. Se houver slug na URL (Vitrine Pública), prioriza ele
        if (storeSlug) {
          const { data } = await supabase.from('branding').select('*').eq('slug', storeSlug).maybeSingle()
          brandingData = data
        }

        // 2. Se não houver slug, mas o usuário estiver logado (Painel Admin), usa o ID dele
        if (!brandingData) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase.from('branding').select('*').eq('user_id', user.id).maybeSingle()
            brandingData = data
          }
        }
        
        // 3. Fallback: Busca o branding mais recente (provavelmente o da empresária atual)
        if (!brandingData) {
          const { data } = await supabase.from('branding').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
          brandingData = data
        }

        if (brandingData) {
          const rawTagline = brandingData.facebook || ''
          const [tagline, , banner] = rawTagline.split('|')
          
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
      {branding?.topBanner && (
        <div className="w-full bg-brand-primary py-1.5 text-center overflow-hidden shadow-inner">
           <p className="text-white text-[7px] md:text-[9px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] animate-pulse">
             ✨ {branding.topBanner} ✨
           </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-5 relative">
        
        {/* ESTRUTURA DE ALTA PRECISÃO: Logo (Esq), Frase (Centro Absoluto), Sacola (Dir) */}
        <div className="flex items-center justify-between w-full">
          
          {/* LOGOTIPO (ESQUERDA) */}
          <Link href="/?catalogo=true" className="flex-shrink-0 group z-10">
            {branding?.logo_url ? (
              <div className="relative w-20 md:w-48 h-8 md:h-14 transition-all duration-500 group-hover:scale-105">
                 <img src={branding.logo_url} alt={branding.store_name || "Logo"} className="w-full h-full object-contain object-left" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center text-white">
                  <span className="text-xs font-bold italic">{(branding?.store_name || 'L')[0]}</span>
                </div>
              </div>
            )}
          </Link>

          {/* FRASE DE IMPACTO (CENTRO ABSOLUTO NO DESKTOP E MOBILE) */}
          {branding?.tagline && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[40%] md:max-w-[50%] pointer-events-none">
              <p className="text-[7px] md:text-[10px] font-black tracking-[0.1em] md:tracking-[0.5em] uppercase text-brand-primary leading-tight line-clamp-2 text-center">
                {branding.tagline}
              </p>
            </div>
          )}

          {/* SACOLA (DIREITA) */}
          <div className="flex items-center z-10">
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
