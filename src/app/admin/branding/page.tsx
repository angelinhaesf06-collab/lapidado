'use client'

import { useState, useEffect } from 'react'
import { Camera, Loader2, Palette, Phone, Gem } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function BrandingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [tagline, setTagline] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [topBanner, setTopBanner] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#4a322e')
  const [secondaryColor, setSecondaryColor] = useState('#c99090')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [taxId, setTaxId] = useState('')
  const [stateRegistration, setStateRegistration] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [instagram, setInstagram] = useState('')
  const [warrantyTime, setWarrantyTime] = useState('') 
  const [installments, setInstallments] = useState('10')
  const [brandingId, setBrandingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadBranding() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let { data } = await supabase.from('branding').select('*').eq('user_id', user.id).maybeSingle()

        if (!data) {
          const { data: orphanedData } = await supabase.from('branding').select('*').is('user_id', null).limit(1).maybeSingle()
          data = orphanedData
        }

        if (data) {
          setBrandingId(data.id)
          const rawTagline = data.facebook || ''
          const [text, inst, banner, bName] = rawTagline.split('|')
          setTagline(text || '') 
          setInstallments(inst || '10')
          setTopBanner(banner || '')
          setBusinessName(data.store_name || bName || '')
          setTiktok(data.website || '') 
          setWarrantyTime(data.tiktok || '') 
          setPrimaryColor(data.primary_color || '#4a322e')
          setSecondaryColor(data.secondary_color || '#c99090')
          setLogo(data.logo_url)
          setPhone(data.phone || '')
          setAddress(data.address || '')
          setInstagram(data.instagram || '')
          setTaxId(data.tax_id || '')
          setStateRegistration(data.state_registration || '')
        }
      } catch (e: unknown) {
        console.error('Erro ao carregar marca', e)
      } finally {
        setLoading(false)
      }
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
      try {
        const res = await fetch('/api/ai/colors', { method: 'POST', body: JSON.stringify({ image: base64 }) })
        const colors = await res.json()
        if (colors.primary) setPrimaryColor(colors.primary)
        if (colors.secondary) setSecondaryColor(colors.secondary)
      } catch (err) { console.error('Erro na extração cromática', err) }
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada.')

      const newSlug = businessName.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer LAPIDADO_ADMIN_2026` },
        body: JSON.stringify({
          table: 'branding',
          id: brandingId,
          data: {
            user_id: user.id, 
            business_name: businessName,
            store_name: businessName.toUpperCase(),
            slug: newSlug,
            facebook: `${tagline.toUpperCase()}|${installments}|${topBanner.toUpperCase()}|${businessName}`,
            tiktok: warrantyTime.toUpperCase(), 
            website: tagline.toUpperCase(), // Restaura para a vitrine ler aqui também
            instagram: instagram,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            logo_url: currentLogoUrl,
            phone: phone,
            address: address,
            tax_id: taxId,
            state_registration: stateRegistration
          }
        })
      })

      if (!response.ok) throw new Error('Falha ao salvar dados.')
      alert('IDENTIDADE ATUALIZADA! 💎')
      window.location.reload()
    } catch (err: unknown) {
      const error = err as Error
      alert('ERRO: ' + error.message)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-secondary" size={32} /></div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.4em] mb-2">ESPAÇO DA EMPRESÁRIA</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-brand-primary uppercase tracking-tight">DNA da Marca</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2"><Palette className="text-brand-secondary" size={18} /><h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Identidade Visual</h3></div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-brand-secondary/20 flex items-center justify-center bg-brand-secondary/5 group">
              {logo ? <Image src={logo} alt="LOGO" fill className="object-contain p-3" /> : <Camera size={24} className="text-brand-secondary/30" />}
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/5 transition-all">
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
              </label>
            </div>
            <p className="text-[9px] font-bold text-brand-secondary/40 uppercase tracking-widest">Clique para alterar logo</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-secondary uppercase block ml-1">Cor Primária</label>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full h-12 rounded-2xl cursor-pointer border-0 shadow-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-secondary uppercase block ml-1">Cor Secundária</label>
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full h-12 rounded-2xl cursor-pointer border-0 shadow-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-secondary uppercase block ml-1">Nome da Loja</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-sm font-bold text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-secondary uppercase block ml-1">Frase de Impacto (Slogan)</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-sm font-medium text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-secondary uppercase block ml-1">Frase de Topo da Vitrine (Banner)</label>
            <input type="text" value={topBanner} onChange={(e) => setTopBanner(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-sm font-medium text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2"><Phone className="text-brand-secondary" size={18} /><h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Dados e Contatos</h3></div>

          <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-brand-secondary uppercase ml-1">WhatsApp da Loja</label>
               <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-sm outline-none" />
            </div>
            
            <div className="space-y-1">
               <label className="text-[10px] font-black text-brand-secondary uppercase ml-1">Endereço Físico</label>
               <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-sm outline-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-secondary uppercase ml-1">CNPJ ou CPF</label>
                <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-brand-primary/5 text-sm outline-none font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-secondary uppercase ml-1">I.E. (Opcional)</label>
                <input type="text" value={stateRegistration} onChange={(e) => setStateRegistration(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-brand-primary/5 text-sm outline-none font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-brand-secondary uppercase ml-1">Instagram</label>
                  <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-sm outline-none" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-brand-secondary uppercase ml-1">TikTok</label>
                  <input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-sm outline-none" />
               </div>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-secondary/10 flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
               <label className="text-[10px] font-black text-brand-secondary uppercase block ml-1 text-center">Garantia das Joias</label>
               <input type="text" value={warrantyTime} onChange={(e) => setWarrantyTime(e.target.value.toUpperCase())} className="w-full px-4 py-4 rounded-2xl bg-brand-secondary text-white text-xs font-black text-center outline-none shadow-md" />
            </div>
            <div className="flex-1 space-y-2">
               <label className="text-[10px] font-black text-brand-secondary uppercase block ml-1 text-center">Parcelamento Máx</label>
               <select value={installments} onChange={(e) => setInstallments(e.target.value)} className="w-full px-4 py-4 rounded-2xl bg-brand-primary text-white text-xs font-black text-center outline-none shadow-md appearance-none">
                 {[1,2,3,4,5,6,8,10,12].map(n => <option key={n} value={n} className="text-brand-primary bg-white">{n}X SEM JUROS</option>)}
               </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <button onClick={handleSave} disabled={saving} className="w-full max-w-sm py-5 rounded-[25px] bg-brand-primary text-white text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" size={20} /> : <><Gem size={20} /> SALVAR IDENTIDADE DA MARCA</>}
        </button>
      </div>
    </div>
  )
}
