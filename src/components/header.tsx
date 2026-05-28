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
            const { data } = await supabase.from('branding')
              .select('*')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            brandingData = data
          }
        }
        
        if (brandingData) {
          setBranding({ 
            logo_url: brandingData.logo_url,
            tagline: brandingData.tagline || null,
            topBanner: brandingData.top_banner || null,
            warranty: brandingData.warranty_time || null,
            store_name: brandingData.business_name || brandingData.store_name || ''
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
        <div className="w-full bg-brand-primary py-1 text-center overflow-hidden shadow-inner">
           <p className="text-white text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] animate-pulse">
             ✨ {branding.topBanner} ✨
           </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-3 relative">
        
        {/* ESTRUTURA DE ALTA PRECISÃO: Logo (Esq), Frase (Centro Absoluto), Sacola (Dir) */}
        <div className="flex items-center justify-between w-full">
          
          {/* LOGOTIPO (ESQUERDA) */}
          <Link href="/?catalogo=true" className="flex-shrink-0 group z-10">
            {branding?.logo_url ? (
              <div className="relative w-16 md:w-32 h-6 md:h-10 transition-all duration-500 group-hover:scale-105">
                <Image src={branding.logo_url} alt={branding.store_name || "Logo"} fill sizes="(max-width: 768px) 64px, 128px" className="object-contain object-left" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white">
                  <span className="text-[10px] font-bold italic">{(branding?.store_name || '')[0]}</span>
                </div>
              </div>
            )}
          </Link>

          {/* FRASE DE IMPACTO (CENTRO ABSOLUTO NO DESKTOP E MOBILE) */}
          {branding?.tagline && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[40%] md:max-w-[50%] pointer-events-none">
              <p className="text-[6px] md:text-[9px] font-black tracking-[0.1em] md:tracking-[0.4em] uppercase text-brand-primary leading-tight line-clamp-2 text-center opacity-80">
                {branding.tagline}
              </p>
            </div>
          )}

          {/* SACOLA (DIREITA) */}
          <div className="flex items-center justify-self-end">
            <Link 
              href="/cart?catalogo=true" 
              className="group flex items-center gap-2 p-1 md:p-2 rounded-lg bg-brand-primary/10 hover:bg-brand-primary transition-all text-brand-primary hover:text-white"
              aria-label={`Ver sacola de compras com ${itemCount} itens`}
            >
               <div className="relative">
                 <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} aria-hidden="true" />
                 {itemCount > 0 && (
                   <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-brand-primary text-white text-[7px] flex items-center justify-center rounded-full border border-white shadow-sm font-black">
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
