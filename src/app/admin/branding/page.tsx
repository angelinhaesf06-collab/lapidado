'use client'

import { useState, useEffect } from 'react'
import { Upload, Phone, Camera, Loader2, Palette, Gem, MapPin, Camera as InstagramIcon, Music2, Pencil } from 'lucide-react'
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
  const [warrantyTime, setWarrantyTime] = useState('') // Começa vazio para a cliente escrever
  const [brandingId, setBrandingId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function loadBranding() {
      try {
        const { data } = await supabase.from('branding').select('*').single()
        if (data) {
          setBrandingId(data.id)
          setTagline(data.business_name || '')
          setWarrantyTime(data.instagram || '') // Pega o que está no banco ou vazio
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
    reader.onload = (event) => {
      setLogo(event.target?.result as string)
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

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-secondary" size={32} /></div>

  return (
    <div className="max-w-4xl mx-auto py-4 px-5 pb-20">
      <div className="text-center mb-6">
        <h1 className="text-[7px] font-black text-brand-secondary uppercase tracking-[0.4em] mb-1">ESPAÇO DA EMPRESÁRIA</h1>
        <h2 className="text-lg md:text-xl font-bold text-brand-primary uppercase tracking-tight">DNA da Marca</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DNA Visual - Ultra Fino */}
        <div className="bg-white p-5 rounded-[30px] border border-rose-50 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1"><Palette className="text-brand-secondary" size={14} /><h3 className="text-[9px] font-bold text-brand-primary uppercase tracking-wider">Visual</h3></div>
          
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border border-dashed border-rose-200 flex items-center justify-center bg-rose-50/20 group">
              {logo ? <Image src={logo} alt="LOGO" fill className="object-contain p-2" /> : <Camera size={18} className="text-brand-secondary/30" />}
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center">
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[6px] font-black text-brand-secondary uppercase block mb-1">Primária</label>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0" />
            </div>
            <div>
              <label className="text-[6px] font-black text-brand-secondary uppercase block mb-1">Secundária</label>
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0" />
            </div>
          </div>

          <div>
            <label className="text-[6px] font-black text-brand-secondary uppercase block mb-1">Frase de Impacto</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-rose-50/20 border border-transparent focus:border-brand-secondary outline-none text-[9px] italic text-[#7a5c58]" />
          </div>
        </div>

        {/* Contatos - Ultra Fino */}
        <div className="bg-white p-5 rounded-[30px] border border-rose-50 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1"><Phone className="text-brand-secondary" size={14} /><h3 className="text-[9px] font-bold text-brand-primary uppercase tracking-wider">Contatos</h3></div>

          <div className="space-y-2">
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WHATSAPP" className="w-full px-3 py-2 rounded-xl bg-rose-50/20 text-[9px] outline-none" />
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="INSTAGRAM" className="w-full px-3 py-2 rounded-xl bg-rose-50/20 text-[9px] outline-none" />
            <input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TIKTOK" className="w-full px-3 py-2 rounded-xl bg-rose-50/20 text-[9px] outline-none" />
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ENDEREÇO" className="w-full px-3 py-2 rounded-xl bg-rose-50/20 text-[9px] outline-none" />
          </div>

          {/* GARANTIA - CONFORME PEDIDO: COR PRIMÁRIA, SEM TEXTO PADRÃO, COM LÁPIS */}
          <div className="pt-2 border-t border-rose-50 flex flex-col items-center">
            <div className="relative w-full max-w-[160px]">
              <input 
                type="text" 
                value={warrantyTime} 
                onChange={(e) => setWarrantyTime(e.target.value.toUpperCase())} 
                placeholder="ESCREVA A GARANTIA..."
                className="w-full px-3 py-2 rounded-xl bg-brand-primary text-white text-[9px] font-black text-center outline-none shadow-sm tracking-[0.1em] placeholder:text-white/40" 
              />
              <Pencil size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button onClick={handleSave} disabled={saving} className="w-full max-w-xs py-4 rounded-[20px] bg-brand-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <><Gem size={16} /> <span>SALVAR IDENTIDADE DA MARCA</span></>}
        </button>
      </div>
    </div>
  )
}
