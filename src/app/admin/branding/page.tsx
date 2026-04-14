'use client'

import { useState, useEffect } from 'react'
import { Upload, Phone, Camera, Loader2, Palette, Sparkles, MapPin, Camera as InstagramIcon, Music2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function BrandingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [tagline, setTagline] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#4a322e')
  const [secondaryColor, setSecondaryColor] = useState('#c99090')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [instagram, setInstagram] = useState('')
  const [warrantyTime, setWarrantyTime] = useState('ETERNA')
  const [brandingId, setBrandingId] = useState<string | null>(null)
  const [extracting] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    async function loadBranding() {
      try {
        const { data } = await supabase.from('branding').select('*').single()
        if (data) {
          setBrandingId(data.id)
          setTagline(data.business_name || '') // Frase de Impacto salva aqui
          setWarrantyTime(data.instagram || 'ETERNA') // Garantia salva aqui
          
          setPrimaryColor(data.primary_color || '#4a322e')
          setSecondaryColor(data.secondary_color || '#c99090')
          setLogo(data.logo_url)
          setPhone(data.phone || '')
          setAddress(data.address || '')
          setTiktok(data.tiktok || '')
          setInstagram(data.website || '')
        }
      } catch (e: unknown) {
        console.error('Erro ao carregar marca', e)
      }
      setLoading(false)
    }
    loadBranding()
  }, [supabase])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setLogo(base64)
      // Extração de cores desativada para compatibilidade com Vercel
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let currentLogoUrl = logo
      if (logoFile) {
        const formData = new FormData()
        formData.append('file', logoFile)
        formData.append('bucket', 'branding')
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (uploadData.url) currentLogoUrl = uploadData.url
      }

      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer LAPIDADO_ADMIN_2026'
        },
        body: JSON.stringify({
          table: 'branding',
          id: brandingId,
          data: {
            business_name: tagline.toUpperCase(),
            instagram: warrantyTime.toUpperCase(),
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            logo_url: currentLogoUrl,
            phone: phone,
            address: address,
            tiktok: tiktok,
            website: instagram
          }
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      alert('IDENTIDADE DA MARCA ATUALIZADA! 💎✨')
      window.location.reload()
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert('ERRO AO SALVAR: ' + error.message.toUpperCase())
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-secondary" size={48} /></div>

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 pb-20">
      {extracting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-brand-primary mb-4" size={48} />
          <p className="text-brand-primary font-black animate-pulse">LAPIDADO ANALISANDO SEU LOGO... 💎</p>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.4em] mb-4">ESPAÇO DA EMPRESÁRIA</h1>
        <h2 className="text-3xl font-bold text-brand-primary uppercase tracking-tight">BRANDING DNA & ESTILO</h2>
        <p className="text-[#7a5c58] text-[10px] mt-4 font-black uppercase tracking-[0.1em]">&quot;NOSSA INTELIGÊNCIA IDENTIFICA SUAS CORES AUTOMATICAMENTE.&quot; ✨</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-rose-50 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-4"><Palette className="text-brand-secondary" size={20} /><h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider">DNA Visual</h3></div>
          
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-brand-secondary/30 flex items-center justify-center bg-brand-secondary/5 group">
              {logo ? <Image src={logo} alt="LOGO" fill className="object-contain p-4" /> : <Camera size={24} className="text-brand-secondary/40" />}
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/10 transition-all">
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                <div className="opacity-0 group-hover:opacity-100 bg-white/90 p-2 rounded-full shadow-lg transition-all">
                   <Upload size={16} className="text-brand-primary" />
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest block mb-2 ml-2">COR PRIMÁRIA (AURA)</label>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full h-14 rounded-2xl cursor-pointer border-0 shadow-inner" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest block mb-2 ml-2">COR SECUNDÁRIA (BRILHO)</label>
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full h-14 rounded-2xl cursor-pointer border-0 shadow-inner" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest block mb-2 ml-2">FRASE DE IMPACTO (VOZ DA MARCA)</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="EX: A ELEGÂNCIA EM CADA DETALHE" className="w-full px-6 py-4 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none transition-all italic text-[#7a5c58]" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-rose-50 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-4"><Phone className="text-brand-secondary" size={20} /><h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider">Contatos e Redes</h3></div>

          <div>
            <label className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest block mb-2 ml-2">WHATSAPP DE VENDAS</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full px-6 py-4 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest block mb-2 ml-2">PERFIL DO INSTAGRAM (SEM @)</label>
            <div className="relative">
              <InstagramIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-secondary" />
              <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="minhaloja_oficial" className="w-full pl-14 pr-6 py-4 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest block mb-2 ml-2">USUÁRIO TIKTOK (SEM @)</label>
            <div className="relative">
              <Music2 className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-secondary" size={16} />
              <input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="minha_loja" className="w-full pl-14 pr-6 py-4 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest block mb-2 ml-2">ENDEREÇO / SHOWROOM</label>
            <div className="relative">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-secondary" size={16} />
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Cidade - Estado" className="w-full pl-14 pr-6 py-4 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none text-xs" />
            </div>
          </div>

          <div className="pt-4 border-t border-rose-50">
            <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest block mb-2 ml-2">TEMPO DE GARANTIA (EX: ETERNA, 1 ANO)</label>
            <input type="text" value={warrantyTime} onChange={(e) => setWarrantyTime(e.target.value.toUpperCase())} placeholder="ETERNA" className="w-full px-6 py-4 rounded-3xl bg-brand-primary text-white font-bold outline-none shadow-lg text-center" />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-6 rounded-[32px] bg-brand-primary text-white font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-4 mt-10 disabled:opacity-50">
        {saving ? <Loader2 className="animate-spin" size={24} /> : <><Sparkles size={24} /> <span>SALVAR IDENTIDADE DA MARCA</span></>}
      </button>
    </div>
  )
}
