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
  const [warrantyTime, setWarrantyTime] = useState('ETERNA')
  const [brandingId, setBrandingId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function loadBranding() {
      try {
        const { data } = await supabase.from('branding').select('*').single()
        if (data) {
          setBrandingId(data.id)
          setTagline(data.business_name || '')
          setWarrantyTime(data.instagram || 'ETERNA')
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
    <div className="max-w-4xl mx-auto py-6 px-5 pb-20">
      <div className="text-center mb-8">
        <h1 className="text-[8px] font-black text-brand-secondary uppercase tracking-[0.4em] mb-2">ESPAÇO DA EMPRESÁRIA</h1>
        <h2 className="text-xl md:text-2xl font-bold text-brand-primary uppercase tracking-tight">DNA da Marca</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DNA Visual - Fino */}
        <div className="bg-white p-6 rounded-[40px] border border-rose-50 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2"><Palette className="text-brand-secondary" size={16} /><h3 className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">DNA Visual</h3></div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-rose-200 flex items-center justify-center bg-rose-50/30 group">
              {logo ? <Image src={logo} alt="LOGO" fill className="object-contain p-3" /> : <Camera size={20} className="text-brand-secondary/40" />}
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center hover:bg-black/5 transition-all">
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-1 ml-1">Primária</label>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer border-0" />
            </div>
            <div>
              <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-1 ml-1">Secundária</label>
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer border-0" />
            </div>
          </div>

          <div>
            <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-1 ml-1">Frase de Impacto</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-rose-50/30 border border-transparent focus:border-brand-secondary outline-none text-[10px] italic text-[#7a5c58]" />
          </div>
        </div>

        {/* Contatos - Fino */}
        <div className="bg-white p-6 rounded-[40px] border border-rose-50 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2"><Phone className="text-brand-secondary" size={16} /><h3 className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Contatos</h3></div>

          <div className="space-y-3">
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WHATSAPP" className="w-full px-4 py-3 rounded-2xl bg-rose-50/30 text-[10px] outline-none" />
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="INSTAGRAM (SEM @)" className="w-full px-4 py-3 rounded-2xl bg-rose-50/30 text-[10px] outline-none" />
            <input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TIKTOK (SEM @)" className="w-full px-4 py-3 rounded-2xl bg-rose-50/30 text-[10px] outline-none" />
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ENDEREÇO / CIDADE" className="w-full px-4 py-3 rounded-2xl bg-rose-50/30 text-[10px] outline-none" />
          </div>

          <div className="pt-3 border-t border-rose-50">
            <label className="text-[7px] font-black text-brand-primary uppercase block mb-1">Garantia</label>
            <input type="text" value={warrantyTime} onChange={(e) => setWarrantyTime(e.target.value.toUpperCase())} className="w-full px-4 py-3 rounded-2xl bg-brand-primary text-white text-[10px] font-bold text-center outline-none shadow-sm" />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-5 rounded-[24px] bg-brand-primary text-white font-black uppercase tracking-widest shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-3 mt-8 disabled:opacity-50">
        {saving ? <Loader2 className="animate-spin" size={20} /> : <><Gem size={20} /> <span>SALVAR IDENTIDADE DA MARCA</span></>}
      </button>
    </div>
  )
}
 text-white font-black uppercase tracking-widest shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-3 mt-8 disabled:opacity-50">
        {saving ? <Loader2 className="animate-spin" size={20} /> : <><Gem size={20} /> <span>SALVAR IDENTIDADE DA MARCA</span></>}
      </button>
    </div>
  )
}
