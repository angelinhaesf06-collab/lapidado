'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gem, Loader2, Plus, CheckCircle2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function NewProductPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [images, setImages] = useState<{file: File | null, preview: string}[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [materialFinish, setMaterialFinish] = useState('OURO 18K')
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [costPrice, setCostPrice] = useState<string>('')
  const [margin, setMargin] = useState<string>('100')
  const [salePrice, setSalePrice] = useState<string>('')
  const [stock, setStock] = useState<string>('1')
  const [aiStyle, setAiStyle] = useState<'luxo' | 'venda' | 'simples'>('luxo')

  const router = useRouter()
  const supabase = createClient()

  const FINISH_OPTIONS = ['OURO 18K', 'PRATA', 'PRATA 925', 'OURO ROSE', 'RODIO BRANCO', 'RODIO NEGRO']
  const AI_STYLES = [
    { id: 'luxo', label: 'MODO LUXO', desc: 'Sofisticado e poético' },
    { id: 'venda', label: 'MODO VENDA', desc: 'Gatilhos e desejo' },
    { id: 'simples', label: 'MODO SIMPLES', desc: 'Direto e objetivo' }
  ]

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: catData } = await supabase.from('categories').select('*').eq('user_id', user.id).order('name')
    if (catData) setCategories(catData)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // 💎 LÓGICA DE PRECIFICAÇÃO BIDIRECIONAL
  const updateSalePrice = (cost: string, m: string) => {
    const c = parseFloat(cost) || 0
    const marginPercent = parseFloat(m) || 0
    if (c > 0) {
      setSalePrice((c + (c * (marginPercent / 100))).toFixed(2))
    }
  }

  const updateMargin = (cost: string, sale: string) => {
    const c = parseFloat(cost) || 0
    const s = parseFloat(sale) || 0
    if (c > 0 && s > 0) {
      const m = ((s - c) / c) * 100
      setMargin(m.toFixed(0))
    }
  }

  const handleCostChange = (val: string) => {
    setCostPrice(val)
    updateSalePrice(val, margin)
  }

  const handleMarginChange = (val: string) => {
    setMargin(val)
    updateSalePrice(costPrice, val)
  }

  const handleSalePriceChange = (val: string) => {
    setSalePrice(val)
    updateMargin(costPrice, val)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => setImages(prev => [...prev, { file, preview: event.target?.result as string }].slice(0, 6))
      reader.readAsDataURL(file)
    })
  }

  const compressImage = async (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.src = base64Str
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 512 // ⚡ REDUZIDO PARA MÁXIMA VELOCIDADE
        let width = img.width, height = img.height
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.5)) // ⚡ QUALIDADE REDUZIDA
      }
    })
  }

  const generateAIDescription = async () => {
    if (images.length === 0 || aiLoading) return
    setAiLoading(true)
    setAiError(null)
    try {
      const compressed = await compressImage(images[0].preview)
      const response = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressed, style: aiStyle })
      })
      const data = await response.json()
      
      if (data.name) setName(String(data.name))
      
      if (data.description) {
        // ✨ Efeito de Streaming (Typing Effect) para melhorar a percepção de velocidade
        const fullText = String(data.description)
        setDescription('') // Limpa antes de começar
        let currentText = ''
        const words = fullText.split(' ')
        
        for (let i = 0; i < words.length; i++) {
          currentText += words[i] + ' '
          setDescription(currentText)
          await new Promise(res => setTimeout(res, 30)) // Velocidade da "digitação"
        }
      }

      if (data.category) {
        const aiCat = String(data.category).toUpperCase()
        const found = categories.find(c => c.name.toUpperCase().includes(aiCat) || aiCat.includes(c.name.toUpperCase()))
        if (found) setCategory(found.id)
      }
    } catch {
      setAiError("IA INDISPONÍVEL. CONTINUE MANUALMENTE. ✨")
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (images.length === 0) return alert('ADICIONE UMA FOTO. 📸')
    if (!name || !category || !salePrice) return alert('PREENCHA NOME, CATEGORIA E PREÇO. 💎')

    setIsSaving(true)
    try {
      let finalImageUrl = ""
      
      try {
        const compressedBase64 = await compressImage(images[0].preview)
        const res = await fetch(compressedBase64)
        const blob = await res.blob()
        const formData = new FormData()
        formData.append('file', blob, 'foto.jpg')
        
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        
        if (uploadData.url) {
          finalImageUrl = uploadData.url
        } else {
          finalImageUrl = compressedBase64
        }
      } catch {
        finalImageUrl = images[0].preview
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('SESSÃO EXPIRADA. FAÇA LOGIN NOVAMENTE.')

      const productData = {
        name: name.toUpperCase(),
        price: parseFloat(salePrice),
        cost_price: parseFloat(costPrice) || 0,
        stock_quantity: parseInt(stock) || 0,
        category_id: category,
        description: description.toUpperCase(),
        material_finish: materialFinish,
        image_url: finalImageUrl,
        user_id: user.id
      }
      
      const saveRes = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'products', data: productData })
      })
      const result = await saveRes.json()
      if (!result.success) throw new Error(result.error)
      
      alert('JOIA SALVA! 💎')
      setName(''); setDescription(''); setCostPrice(''); setSalePrice(''); setImages([]); setStock('1')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      alert('ERRO: ' + message.toUpperCase())
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 pb-20">
      <div className="mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight uppercase text-brand-primary">Nova Joia</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Adicione brilho ao seu acervo 💎</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-[20px] overflow-hidden border border-rose-100 shadow-sm">
                <Image src={img.preview} alt="" className="object-cover" fill />
                <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== index))} className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 rounded-full text-rose-500 shadow-md backdrop-blur-sm"><X size={12} /></button>
              </div>
            ))}
            {images.length < 6 && (
              <label className="cursor-pointer aspect-square rounded-[20px] border-2 border-dashed border-rose-200 flex flex-col items-center justify-center bg-white hover:bg-rose-50/50 transition-colors group">
                <Plus size={20} className="text-brand-secondary group-hover:scale-125 transition-transform" />
                <span className="text-[7px] font-black text-brand-secondary mt-1 uppercase">Adicionar</span>
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" multiple />
              </label>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[8px] font-black text-brand-secondary uppercase ml-1 tracking-[0.2em]">Estilo da Descrição Mágica</label>
            <div className="grid grid-cols-3 gap-2">
              {AI_STYLES.map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setAiStyle(style.id as any)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                    aiStyle === style.id 
                    ? 'bg-brand-primary/5 border-brand-primary text-brand-primary shadow-sm' 
                    : 'bg-white border-brand-secondary/10 text-brand-secondary/40 hover:border-brand-secondary/20'
                  }`}
                >
                  <span className="text-[8px] font-black uppercase tracking-widest">{style.label}</span>
                  <span className="text-[6px] font-bold opacity-60 uppercase">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            type="button" 
            disabled={images.length === 0 || aiLoading} 
            onClick={generateAIDescription} 
            className="w-full py-4.5 rounded-2xl bg-brand-primary text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Gem size={18} />} <span>MÁGICA LAPIDADO</span>
          </button>
          {aiError && <p className="text-[9px] text-rose-500 font-bold text-center uppercase tracking-widest">{aiError}</p>}
        </div>

        <div className="space-y-4 bg-white p-6 md:p-8 rounded-[40px] border border-brand-secondary/5 shadow-sm">
          <div>
            <label className="text-[8px] font-black text-brand-secondary uppercase mb-2 block ml-1 tracking-widest">Acabamento</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {FINISH_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => setMaterialFinish(opt)} className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${materialFinish === opt ? 'bg-brand-primary text-white shadow-md' : 'bg-rose-50/30 text-brand-secondary/60 border border-rose-100/50 hover:bg-rose-50'}`}>{opt}</button>
              ))}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-brand-secondary uppercase ml-1 tracking-widest">Nome da Peça</label>
            <input type="text" placeholder="EX: ANEL SOLITÁRIO LUXO" value={name} onChange={e => setName(e.target.value.toUpperCase())} className="w-full px-5 py-3.5 rounded-2xl border border-rose-100 bg-rose-50/10 font-bold text-[11px] text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all placeholder:text-brand-secondary/20" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-brand-secondary uppercase ml-1 tracking-widest">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl border border-rose-100 bg-rose-50/10 text-[10px] font-bold text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all appearance-none">
                <option value="">CATEGORIA...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-brand-secondary uppercase ml-1 tracking-widest">Estoque</label>
              <input type="number" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl border border-rose-100 bg-rose-50/10 font-bold text-brand-primary text-[10px] outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-brand-primary/5 border border-brand-primary/10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-brand-primary uppercase ml-1 tracking-widest">Custo R$</label>
                <input type="number" step="0.01" placeholder="0,00" value={costPrice} onChange={e => handleCostChange(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-white border border-brand-primary/10 text-[11px] font-bold text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-amber-700 uppercase ml-1 tracking-widest">Margem %</label>
                <div className="relative">
                  <input type="number" placeholder="100" value={margin} onChange={e => handleMarginChange(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-amber-50 border border-amber-200/50 text-[11px] font-black text-amber-700 text-center outline-none focus:ring-2 focus:ring-amber-200 transition-all" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-700/30">%</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-brand-primary uppercase ml-1 tracking-widest text-center block">Preço Final de Venda</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-white/40 italic">R$</span>
                <input type="number" step="0.01" placeholder="0,00" value={salePrice} onChange={e => handleSalePriceChange(e.target.value)} className="w-full p-5 md:p-6 rounded-2xl bg-brand-primary text-white text-3xl font-black text-center outline-none shadow-xl transition-all focus:scale-[1.02]" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-brand-secondary uppercase ml-1 tracking-widest">Descrição</label>
            <textarea placeholder="DESCREVA OS DETALHES DA JOIA..." value={description} onChange={e => setDescription(e.target.value.toUpperCase())} rows={3} className="w-full px-5 py-4 rounded-2xl border border-rose-100 bg-rose-50/10 text-[10px] font-bold text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none placeholder:text-brand-secondary/20" />
          </div>

          <button type="submit" disabled={isSaving} className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} SALVAR JOIA NO ACERVO
          </button>
        </div>
      </form>
    </div>
  )
}
