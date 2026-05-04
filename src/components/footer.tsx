'use client'

import { useState, useEffect } from 'react'
import { Phone, MapPin, Music2, Camera as InstagramIcon, Gem, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'

interface Branding {
  id: string;
  user_id: string;
  slug: string;
  logo_url: string | null;
  business_name: string | null;
  instagram: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  tiktok: string | null;
  store_name: string | null;
  warranty_time?: string | null;
}

export default function Footer() {
  const [branding, setBranding] = useState<Branding | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadBranding() {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const storeSlug = urlParams.get('loja')

        let brandingData = null

        // 1. Prioriza slug na URL
        if (storeSlug) {
          const { data } = await supabase.from('branding').select('*').eq('slug', storeSlug).maybeSingle()
          brandingData = data
        }

        // 2. Senão, busca por usuário logado (Admin)
        if (!brandingData) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase.from('branding').select('*').eq('user_id', user.id).maybeSingle()
            brandingData = data
          }
        }

        if (brandingData) setBranding(brandingData as unknown as Branding)
      } catch (e) {
        console.error('Erro no Footer Branding', e)
      }
    }
    loadBranding()
  }, [supabase])

  const getCleanPhone = (phone: string | null) => {
    if (!phone) return ''
    let clean = phone.replace(/\D/g, '')
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean
    }
    return clean
  }

  const getWhatsAppLink = () => {
    if (!branding || !branding.phone) return '#'
    const phone = getCleanPhone(branding.phone)
    const storeName = branding.business_name || branding.store_name || 'LAPIDADO'
    const storeSlug = branding.slug || ''
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lapidado.vercel.app'
    const catalogUrl = storeSlug ? `${baseUrl}/?catalogo=true&loja=${storeSlug}` : baseUrl
    
    const msg = encodeURIComponent(`Olá! ✨ Vi o catálogo da *${storeName.toUpperCase()}* e gostaria de mais informações.\n\nLink do Catálogo: ${catalogUrl}`)
    return `https://wa.me/${phone}?text=${msg}`
  }

  if (!branding) return null

  return (
    <footer className="bg-white border-t border-brand-secondary/10 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-16">
        
        {/* Lado 1: Identidade e Endereço */}
        <div className="flex flex-col items-center md:items-start space-y-8">
          {branding.logo_url ? (
            <Image 
              src={branding.logo_url} 
              alt="Logo" 
              className="h-16 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700" 
              width={150} 
              height={64} 
            />
          ) : (
            <h3 className="text-2xl font-bold text-brand-primary uppercase tracking-widest opacity-60">
              {branding.store_name || branding.business_name || 'LAPIDADO'}
            </h3>
          )}

          {branding.address && (
            <div className="space-y-3 text-center md:text-left">
              <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Nossa Localização</h4>
              <div className="flex items-start justify-center md:justify-start gap-3 text-brand-primary/70">
                <MapPin size={16} className="shrink-0 mt-0.5" />
                <span className="text-[11px] font-bold tracking-widest uppercase leading-relaxed max-w-[200px]">
                  {branding.address}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Lado 2: Atendimento e Acesso */}
        <div className="flex flex-col items-center space-y-8">
          <div className="space-y-6 flex flex-col items-center">
            <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Atendimento</h4>
            
            <div className="space-y-4">
              {branding.phone && (
                <a href={getWhatsAppLink()} target="_blank" className="flex items-center gap-3 text-brand-primary hover:text-brand-secondary transition-colors group bg-brand-secondary/5 px-6 py-3 rounded-full border border-brand-secondary/5">
                  <Phone size={14} className="text-brand-primary" />
                  <span className="text-[11px] font-black tracking-widest">{branding.phone}</span>
                </a>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Link href="/login" className="flex items-center gap-2 text-[9px] font-black text-brand-secondary/40 hover:text-brand-primary uppercase tracking-[0.4em] transition-all group">
              <User size={12} className="group-hover:scale-110 transition-transform" />
              Área Administrativa
            </Link>
          </div>
        </div>

        {/* Lado 3: Conecte-se (Redes Sociais) */}
        <div className="flex flex-col items-center md:items-end space-y-8">
          <div className="space-y-6 flex flex-col items-center md:items-end">
            <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Siga Nosso Brilho</h4>

            <div className="flex gap-4">
              {branding.instagram && (
                <a 
                  href={`https://instagram.com/${branding.instagram.replace('@', '').trim()}`} 
                  target="_blank" 
                  className="p-5 rounded-full bg-brand-secondary/5 text-brand-primary hover:bg-brand-primary hover:text-white hover:scale-110 transition-all border border-brand-secondary/5 shadow-sm"
                  title="Instagram"
                >
                  <InstagramIcon size={20} />
                </a>
              )}
              
              {branding.tiktok && (
                <a 
                  href={`https://tiktok.com/@${branding.tiktok.replace('@', '').trim()}`} 
                  target="_blank" 
                  className="p-5 rounded-full bg-brand-secondary/5 text-brand-primary hover:bg-brand-primary hover:text-white hover:scale-110 transition-all border border-brand-secondary/5 shadow-sm"
                  title="TikTok"
                >
                  <Music2 size={20} />
                </a>
              )}
            </div>
          </div>

          {branding.warranty_time && (
            <div className="bg-brand-primary/5 px-4 py-2 rounded-full border border-brand-primary/10">
              <p className="text-[8px] text-brand-primary font-black uppercase tracking-widest flex items-center gap-2">
                <Gem size={10} /> 
                {branding.warranty_time.toUpperCase().includes('GARANTIA') ? branding.warranty_time : `${branding.warranty_time} DE GARANTIA`}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-20 pt-8 border-t border-brand-secondary/5 flex flex-col items-center gap-4">
        <p className="text-[8px] text-brand-secondary/40 font-bold uppercase tracking-[0.5em]">
          © {new Date().getFullYear()} — {branding.store_name || branding.business_name || 'LAPIDADO'} — TODOS OS DIREITOS RESERVADOS.
        </p>
        <div className="flex items-center gap-2 opacity-20 hover:opacity-50 transition-opacity">
          <span className="text-[7px] font-bold text-brand-primary tracking-widest uppercase">Mais que acessórios, a sua assinatura de estilo.</span>
        </div>
      </div>
    </footer>
  )
}
