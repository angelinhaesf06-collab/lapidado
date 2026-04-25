'use client'

import { useState, useEffect } from 'react'
import { Phone, MapPin, Music2, Camera as InstagramIcon, Gem } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Branding {
  logo_url: string | null;
  business_name: string | null;
  instagram: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  tiktok: string | null;
  store_name: string | null;
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

  if (!branding) return null

  return (
    <footer className="bg-white border-t border-brand-secondary/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-16 items-center">
        
        {/* Lado 1: Assinatura Visual */}
        <div className="flex flex-col items-center md:items-start space-y-4">
          {branding.logo_url ? (
            <Image src={branding.logo_url} alt="Logo" className="h-16 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-700" width={150} height={64} />
          ) : (
            <h3 className="text-2xl text-brand-primary uppercase tracking-widest opacity-50">
              {branding.store_name || branding.business_name || 'LAPIDADO'}
            </h3>
          )}
        </div>

        {/* Lado 2: Contato e Endereço */}
        <div className="space-y-6 flex flex-col items-center md:items-start">
          <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">ATENDIMENTO</h4>
          
          <div className="space-y-4">
            {branding.phone && (
              <a href={`https://wa.me/${branding.phone.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-3 text-brand-primary hover:text-brand-secondary transition-colors group">
                <div className="p-2 rounded-full bg-brand-secondary/10 group-hover:bg-brand-secondary/20"><Phone size={14} /></div>
                <span className="text-[11px] font-bold tracking-widest">{branding.phone}</span>
              </a>
            )}
            
            {branding.address && (
              <div className="flex items-center gap-3 text-brand-primary">
                <div className="p-2 rounded-full bg-brand-secondary/10"><MapPin size={14} /></div>
                <span className="text-[11px] font-bold tracking-widest uppercase">{branding.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Lado 3: Redes Sociais */}
        <div className="space-y-6 flex flex-col items-center md:items-end text-center md:text-right">
          <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">SIGA NOSSO BRILHO</h4>

          <div className="flex gap-4">
            {branding.tiktok && !branding.tiktok.includes('MESES') && (
              <a href={`https://tiktok.com/@${branding.tiktok.replace('@', '').trim()}`} target="_blank" className="p-4 rounded-full bg-brand-secondary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all">
                <Music2 size={20} />
              </a>
            )}
          </div>
        </div>


      </div>

      <div className="max-w-7xl mx-auto px-8 mt-20 pt-10 border-t border-brand-secondary/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <p className="text-[8px] text-brand-secondary font-bold uppercase tracking-[0.4em]">
            © {new Date().getFullYear()} — TODOS OS DIREITOS RESERVADOS.
          </p>
          {branding.tiktok && (branding.tiktok.includes('MESES') || branding.tiktok.includes('ANO') || branding.tiktok.includes('ETERNA')) && (
            <p className="text-[7px] text-brand-primary/60 font-black uppercase tracking-widest flex items-center gap-2">
              <Gem size={8} /> 💎 {branding.tiktok.toUpperCase().includes('GARANTIA') ? branding.tiktok : `${branding.tiktok} DE GARANTIA`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
          <span className="text-[8px] font-bold text-brand-primary tracking-widest">DESENVOLVIDO COM</span>
          <div className="w-4 h-4 bg-brand-primary rounded-full flex items-center justify-center text-white text-[8px]">✨</div>
        </div>
      </div>
    </footer>
  )
}
