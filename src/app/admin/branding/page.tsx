'use client'

import { useState, useEffect } from 'react'
import { Upload, CheckCircle2, RefreshCw, MapPin, Phone, Camera, Link as LinkIcon, Globe, Gem, Music } from 'lucide-react'
import { Vibrant } from 'node-vibrant/browser'

export default function BrandingPage() {
  const [logo, setLogo] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [colors, setColors] = useState<{primary: string, secondary: string} | null>(null)
  
  // Campos da marca
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [website, setGlobe] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('lapidado-branding')
    if (saved) {
      const parsed = JSON.parse(saved)
      setColors({ primary: parsed.primary, secondary: parsed.secondary })
      setAddress(parsed.address || '')
      setPhone(parsed.phone || '')
      setInstagram(parsed.instagram || '')
      setFacebook(parsed.facebook || '')
      setTiktok(parsed.tiktok || '')
      setGlobe(parsed.website || '')
    }
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setLogo(base64)
      setAnalyzing(true)

      try {
        const palette = await Vibrant.from(base64).getPalette()
        const primary = palette.DarkMuted?.hex || '#4a322e'
        const secondary = palette.Vibrant?.hex || '#c99090'
        
        const newBranding = { primary, secondary, address, phone, instagram, facebook, tiktok, website }
        setColors({ primary, secondary })
        localStorage.setItem('lapidado-branding', JSON.stringify(newBranding))
        
        document.documentElement.style.setProperty('--brand-primary', primary)
        document.documentElement.style.setProperty('--brand-secondary', secondary)
      } catch (err) {
        console.error("Erro ao extrair cores:", err)
      } finally {
        setAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveInfo = () => {
    const currentBranding = JSON.parse(localStorage.getItem('lapidado-branding') || '{}')
    const updatedBranding = { ...currentBranding, address, phone, instagram, facebook, tiktok, website }
    localStorage.setItem('lapidado-branding', JSON.stringify(updatedBranding))
    alert('INFORMAÇÕES DA MARCA SALVAS COM SUCESSO! 💎')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-16">
        <h1 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.4em] mb-4 text-brand-secondary">Lapidado</h1>
        <h2 className="text-4xl font-bold tracking-tight text-[#4a322e] uppercase text-brand-primary">Minha Marca</h2>
        <p className="text-[#c99090] text-[10px] font-light tracking-[0.4em] uppercase mt-2">A identidade visual e contatos da sua empresa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Identidade Visual */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[60px] border border-rose-50 shadow-sm relative overflow-hidden text-brand-primary">
            <h3 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Gem size={14} /> Logotipo e Cores
            </h3>
            
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="w-48 h-48 rounded-full bg-rose-50 border-2 border-dashed border-rose-100 flex items-center justify-center relative overflow-hidden group">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain p-4" />
                ) : (
                  <Upload className="text-[#c99090] opacity-40" size={48} />
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} accept="image/*" />
              </div>

              <div className="space-y-2">
                <p className="font-bold text-xs uppercase tracking-widest">DNA Cromático</p>
                <div className="flex gap-3 justify-center">
                  <div className="w-8 h-8 rounded-full shadow-inner border border-white" style={{ backgroundColor: colors?.primary || '#4a322e' }} title="Cor Primária" />
                  <div className="w-8 h-8 rounded-full shadow-inner border border-white" style={{ backgroundColor: colors?.secondary || '#c99090' }} title="Cor de Destaque" />
                </div>
              </div>

              {analyzing && (
                <div className="flex items-center gap-2 text-[#c99090] animate-pulse">
                  <RefreshCw className="animate-spin" size={14} />
                  <p className="text-[9px] font-bold tracking-[0.3em] uppercase">Analisando marca...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[60px] border border-rose-50 shadow-sm text-brand-primary">
            <h3 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <MapPin size={14} /> Dados de Contato
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">Endereço Físico ou Showroom</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value.toUpperCase())}
                    className="w-full pl-12 pr-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all uppercase text-xs"
                    placeholder="EX: AV. DAS JOIAS, 1000 - SALA 01"
                  />
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c99090]" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">Telefone / WhatsApp</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-xs"
                    placeholder="(00) 00000-0000"
                  />
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c99090]" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">Instagram</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-xs"
                      placeholder="@SUAMARCA"
                    />
                    <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c99090]" size={14} />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">Facebook</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-xs"
                      placeholder="LINK"
                    />
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c99090]" size={14} />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">TikTok</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-xs"
                      placeholder="@TIKTOK"
                    />
                    <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c99090]" size={14} />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveInfo}
                className="w-full py-5 rounded-[32px] bg-[#4a322e] text-white font-black uppercase tracking-widest shadow-xl hover:bg-[#c99090] transition-all flex items-center justify-center gap-3 mt-4"
              >
                <CheckCircle2 size={20} /> <span>Salvar Dados da Marca</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
