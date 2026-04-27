'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gem, Loader2, Check, X, Plus, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function NewProductPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [images, setImages] = useState<{file: File | null, preview: string}[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [materialFinish, setMaterialFinish] = useState('OURO 18K')
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [pricingRules, setPricingRules] = useState<{globalMarkup: number, categoryMarkups: Record<string, number>}>({
    globalMarkup: 100, categoryMarkups: {}
  })
  const [costPrice, setCostPrice] = useState<string>('')
  const [margin, setMargin] = useState<string>('100')
  const [salePrice, setSalePrice] = useState<string>('')
  const [stock, setStock] = useState<string>('1')
  const [aiUsed, setAiUsed] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const FINISH_OPTIONS = ['OURO 18K', 'PRATA', 'PRATA 925', 'OURO ROSE', 'RODIO BRANCO', 'RODIO NEGRO']

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: catData } = await supabase.from('categories').select('*').order('name')
    if (catData) setCategories(catData)
    setDbStatus('ok')
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const cost = parseFloat(costPrice) || 0
    const m = parseFloat(margin) || 0
    if (cost > 0) setSalePrice((cost + (cost * (m / 100))).toFixed(2))
  }, [costPrice, margin])

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
        const MAX_WIDTH = 800
        let width = img.width, height = img.height
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.6))
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
        body: JSON.stringify({ image: compressed })
      })
      const data = await response.json()
      if (data.name) setName(String(data.name))
      if (data.description) setDescription(String(data.description))
      if (data.category) {
        const aiCat = String(data.category).toUpperCase()
        const found = categories.find(c => c.name.toUpperCase().includes(aiCat) || aiCat.includes(c.name.toUpperCase()))
        if (found) setCategory(found.id)
      }
    } catch (err) {
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
          // 🚀 PLANO B: Se o servidor de arquivos falhar, usamos a imagem comprimida direta
          finalImageUrl = compressedBase64
        }
      } catch (e) {
        // Se der erro no upload, tenta usar a imagem direta
        finalImageUrl = images[0].preview
      }

      const { data: { user } } = await supabase.auth.getUser()
      const productData = {
        name: name.toUpperCase(),
        price: parseFloat(salePrice),
        cost_price: parseFloat(costPrice) || 0,
        stock_quantity: parseInt(stock) || 0,
        category_id: category,
        description: description.toUpperCase(),
        material_finish: materialFinish,
        image_url: finalImageUrl,
        user_id: user?.id
      }
      
      const saveRes = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer LAPIDADO_ADMIN_2026` },
        body: JSON.stringify({ table: 'products', data: productData })
      })
      const result = await saveRes.json()
      if (!result.success) throw new Error(result.error)
      
      alert('JOIA SALVA! 💎')
      setName(''); setDescription(''); setCostPrice(''); setSalePrice(''); setImages([]); setStock('1')
      router.refresh()
    } catch (err: any) {
      alert('ERRO: ' + err.message.toUpperCase())
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-12">
        <h2 className="text-3xl font-bold tracking-tight uppercase text-brand-primary">Nova Joia</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Adicione brilho ao seu acervo 💎</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-[16px] overflow-hidden border border-rose-100">
                <Image src={img.preview} alt="" className="object-cover" fill />
                <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== index))} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-rose-500 shadow-sm"><X size={10} /></button>
              </div>
            ))}
            {images.length < 6 && (
              <label className="cursor-pointer aspect-square rounded-[16px] border border-dashed border-rose-200 flex flex-col items-center justify-center bg-white hover:bg-rose-50/50">
                <Plus size={14} className="text-brand-secondary" />
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" multiple />
              </label>
            )}
          </div>
          <button type="button" disabled={images.length === 0 || aiLoading} onClick={generateAIDescription} className="w-full py-4 rounded-xl bg-brand-primary text-white text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
            {aiLoading ? <Loader2 className="animate-spin" size={16} /> : <Gem size={16} />} <span>MÁGICA LAPIDADO</span>
          </button>
          {aiError && <p className="text-[8px] text-rose-500 font-bold text-center uppercase">{aiError}</p>}
        </div>

        <div className="space-y-3 bg-white/60 p-5 rounded-[30px] border border-rose-50 shadow-sm">
          <div>
            <label className="text-[7px] font-black text-brand-secondary uppercase mb-1 block">Acabamento</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {FINISH_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => setMaterialFinish(opt)} className={`px-3 py-1.5 rounded-full text-[7px] font-black ${materialFinish === opt ? 'bg-brand-primary text-white' : 'bg-white text-brand-secondary border border-rose-100'}`}>{opt}</button>
              ))}
            </div>
          </div>
          <input type="text" placeholder="NOME DA PEÇA" value={name} onChange={e => setName(e.target.value.toUpperCase())} className="w-full px-4 py-2.5 rounded-xl border border-rose-100 font-bold text-[10px] text-brand-primary outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-rose-100 text-[9px] font-bold text-brand-primary outline-none">
              <option value="">CATEGORIA...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
            </select>
            <input type="number" placeholder="ESTOQUE" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-rose-100 font-bold text-brand-primary text-[9px]" />
          </div>
          <div className="p-4 rounded-2xl bg-white border border-brand-secondary/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="CUSTO R$" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="w-full p-2.5 rounded-xl bg-brand-secondary/5 text-[10px] font-bold outline-none" />
              <div className="relative">
                <input type="number" placeholder="MARGEM %" value={margin} onChange={e => setMargin(e.target.value)} className="w-full p-2.5 rounded-xl bg-amber-50 text-[10px] font-black text-amber-700 text-center outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-amber-700/40">%</span>
              </div>
            </div>
            <input type="number" placeholder="VENDA R$" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="w-full p-4 rounded-xl bg-brand-primary text-white text-2xl font-black text-center outline-none" />
          </div>
          <textarea placeholder="DESCRIÇÃO" value={description} onChange={e => setDescription(e.target.value.toUpperCase())} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-rose-100 text-[8px] font-bold text-brand-primary outline-none" />
          <button type="submit" disabled={isSaving} className="w-full py-4 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} SALVAR JOIA
          </button>
        </div>
      </form>
    </div>
  )
}