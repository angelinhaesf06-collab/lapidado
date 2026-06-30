'use client'

import { useState, useEffect } from 'react'
import { Camera, Loader2, Palette, Phone, Gem, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug, triggerHaptic } from '@/lib/utils'
import Image from 'next/image'

export default function BrandingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
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
  const [currentSlug, setCurrentSlug] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadBranding() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let { data } = await supabase.from('branding')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data) {
          setBrandingId(data.id)
          const storeName = data.business_name || data.store_name || ''
          const storeSlug = data.slug || storeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
          
          setCurrentSlug(storeSlug || null)
          
          // 💎 NEXUS: Lógica de fallback aprimorada para priorizar colunas dedicadas
          setTagline(data.tagline ?? data.facebook?.split('|')[0] ?? '') 
          setInstallments(data.installments?.toString() ?? data.facebook?.split('|')[1] ?? '10')
          setTopBanner(data.top_banner ?? data.facebook?.split('|')[2] ?? '')
          
          setBusinessName(storeName)
          setTiktok(data.tiktok || '') 
          setWarrantyTime(data.warranty_time || '') 
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
      const cleanBusinessName = businessName.trim()
      
      if (!cleanBusinessName) {
        alert('POR FAVOR, INFORME O NOME DA SUA LOJA. 💎')
        setSaving(false)
        return
      }

      let currentLogoUrl = logo
      if (logoFile) {
        console.log('💎 NEXUS: Iniciando upload da logo...');
        const formData = new FormData()
        formData.append('file', logoFile)
        formData.append('bucket', 'branding')
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json()
          throw new Error(errorData.error || 'Falha no upload da imagem.')
        }
        const uploadData = await uploadRes.json()
        if (uploadData.url) currentLogoUrl = uploadData.url
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Por favor, faça login novamente.')

      const newSlug = cleanBusinessName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      const newWebsite = `${typeof window !== 'undefined' ? window.location.origin : ''}/${newSlug}`

      console.log('💎 NEXUS: Salvando dados da marca...', { business_name: cleanBusinessName, slug: newSlug, website: newWebsite });

      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer LAPIDADO_ADMIN_2026` },
        body: JSON.stringify({
          table: 'branding',
          data: {
            user_id: user.id, 
            business_name: cleanBusinessName,
            store_name: cleanBusinessName.toUpperCase(),
            slug: newSlug,
            tagline: tagline.toUpperCase(),
            top_banner: topBanner.toUpperCase(),
            installments: parseInt(installments) || 10,
            tiktok: tiktok, 
            website: newWebsite, 
            instagram: instagram,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            logo_url: currentLogoUrl,
            phone: phone,
            address: address,
            tax_id: taxId,
            state_registration: stateRegistration,
            warranty_time: warrantyTime.toUpperCase()
          }
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Falha ao salvar dados.')
      
      alert('IDENTIDADE ATUALIZADA COM SUCESSO! 💎')
      triggerHaptic('heavy')
      
      // 💎 NEXUS: Atualiza o estado local com a URL final e limpa o arquivo pendente
      setLogo(currentLogoUrl)
      setLogoFile(null)

      // 💎 NEXUS: Notifica o Layout (Pai) que os dados mudaram para atualizar o botão de WhatsApp na hora
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('brandingUpdated'));
      }

      // 💎 NEXUS: Não recarregamos a página para evitar perda de estado visual.
      // O brandingId será atualizado na próxima carga ou podemos manter o estado atual.
    } catch (err: unknown) {
      const error = err as Error
      alert('ERRO: ' + error.message)
    } finally { setSaving(false) }
  }

  const installmentsOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12]
  const generatedLink = brandingId && businessName ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${businessName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}` : 'Defina o nome da loja para gerar o link'

  const copyToClipboard = () => {
    if (!brandingId || !businessName) return
    navigator.clipboard.writeText(generatedLink)
    triggerHaptic('medium')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-secondary" size={32} /></div>

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-6 pb-24">
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-[8px] md:text-[10px] font-black text-brand-secondary uppercase tracking-[0.4em] mb-2">ESPAÇO DA EMPRESÁRIA</h1>
        <h2 className="text-xl md:text-3xl font-bold text-brand-primary uppercase tracking-tight">DNA da Marca</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-brand-secondary/10 shadow-sm space-y-5 md:space-y-6">
          <div className="flex items-center gap-3 mb-2"><Palette className="text-brand-secondary" size={16} /><h3 className="text-[10px] md:text-xs font-bold text-brand-primary uppercase tracking-wider">Identidade Visual</h3></div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-2 border-dashed border-brand-secondary/20 flex items-center justify-center bg-brand-secondary/5 group">
              {logo ? (
                <Image 
                  src={logo} 
                  alt="LOGO" 
                  fill
                  sizes="128px"
                  className="object-contain" 
                  onError={(e) => {
                    console.error("Erro ao carregar logo:", logo);
                    (e.target as HTMLImageElement).src = "/logo-app.png";
                  }}
                />
              ) : (
                <Camera size={24} className="text-brand-secondary/30" />
              )}
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/5 transition-all">
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
              </label>
            </div>
            <p className="text-[8px] font-bold text-brand-secondary/40 uppercase tracking-widest text-center">Clique para alterar logo</p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-brand-secondary uppercase block ml-1">Cor Primária</label>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full h-10 md:h-12 rounded-xl md:rounded-2xl cursor-pointer border-0 shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-brand-secondary uppercase block ml-1">Cor Secundária</label>
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full h-10 md:h-12 rounded-xl md:rounded-2xl cursor-pointer border-0 shadow-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-brand-secondary uppercase block ml-1">Nome da Loja</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-secondary/5 text-sm font-bold text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" />
          </div>

          {currentSlug && (
            <div className="p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
              <p className="text-[7px] font-black text-brand-secondary/40 uppercase tracking-widest mb-1">Link Público da sua Vitrine:</p>
              <p className="text-[10px] font-bold text-brand-primary break-all">{(typeof window !== 'undefined' ? window.location.host : 'lapidado.com.br')}/{currentSlug}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-brand-secondary uppercase block ml-1">Frase de Topo da Vitrine</label>
            <input type="text" value={topBanner} onChange={(e) => setTopBanner(e.target.value)} className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-secondary/5 text-sm font-medium text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" />
          </div>

          <div className="p-4 md:p-5 rounded-2xl md:rounded-[32px] bg-brand-primary/5 border border-brand-primary/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[8px] md:text-[9px] font-black text-brand-primary uppercase tracking-widest">Link da sua Vitrine</label>
              <button 
                onClick={copyToClipboard}
                disabled={!brandingId || !businessName}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-wider transition-all active:scale-95 ${copied ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-brand-primary text-white hover:bg-brand-secondary shadow-md shadow-brand-primary/10'}`}
              >
                {copied ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar Link</>}
              </button>
            </div>
            <div className="p-3 bg-white/50 rounded-xl border border-brand-primary/5">
              <p className="text-[10px] md:text-xs font-bold text-brand-primary break-all leading-relaxed">
                {generatedLink}
              </p>
            </div>
            <p className="text-[7px] font-bold text-brand-secondary/40 uppercase tracking-tighter">
              Este é o link que você deve colocar na sua Bio do Instagram. ✨
            </p>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-brand-secondary/10 shadow-sm space-y-5 md:space-y-6">
          <div className="flex items-center gap-3 mb-2"><Phone className="text-brand-secondary" size={16} /><h3 className="text-[10px] md:text-xs font-bold text-brand-primary uppercase tracking-wider">Dados e Contatos</h3></div>

          <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-[9px] font-black text-brand-secondary uppercase ml-1">WhatsApp da Loja</label>
               <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-secondary/5 text-sm outline-none" />
            </div>
            
            <div className="space-y-1">
               <label className="text-[9px] font-black text-brand-secondary uppercase ml-1">Endereço Físico</label>
               <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-secondary/5 text-sm outline-none" />
            </div>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-brand-secondary uppercase ml-1">CNPJ ou CPF</label>
                <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-primary/5 text-sm outline-none font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-brand-secondary uppercase ml-1">I.E. (Opcional)</label>
                <input type="text" value={stateRegistration} onChange={(e) => setStateRegistration(e.target.value)} className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-primary/5 text-sm outline-none font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 pt-1 md:pt-2">
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-brand-secondary uppercase ml-1">Instagram</label>
                  <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-secondary/5 text-sm outline-none" />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-brand-secondary uppercase ml-1">TikTok</label>
                  <input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-secondary/5 text-sm outline-none" />
               </div>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-secondary/10 flex flex-col xs:flex-row items-center justify-between gap-4">
            <div className="w-full xs:flex-1 space-y-2">
               <label className="text-[9px] font-black text-brand-secondary uppercase block ml-1 text-center">Garantia das Joias</label>
               <input type="text" value={warrantyTime} onChange={(e) => setWarrantyTime(e.target.value.toUpperCase())} className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-secondary text-white text-[10px] md:text-xs font-black text-center outline-none shadow-md" />
            </div>
            <div className="w-full xs:flex-1 space-y-2">
               <label className="text-[9px] font-black text-brand-secondary uppercase block ml-1 text-center">Parcelamento Máx</label>
               <select value={installments} onChange={(e) => setInstallments(e.target.value)} className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-primary text-white text-[10px] md:text-xs font-black text-center outline-none shadow-md appearance-none">
                 {[1,2,3,4,5,6,8,10,12].map(n => <option key={n} value={n} className="text-brand-primary bg-white">{n}X SEM JUROS</option>)}
               </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-10 md:mt-12">
        <button onClick={handleSave} disabled={saving} className="w-full max-w-sm py-4 md:py-5 rounded-2xl md:rounded-[25px] bg-brand-primary text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em] shadow-xl md:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <><Gem size={18} /> SALVAR IDENTIDADE DA MARCA</>}
        </button>
      </div>
    </div>
  )
}
