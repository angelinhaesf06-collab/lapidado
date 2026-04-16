'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gem, Loader2, Check, Calculator, PackageOpen, X, Plus, AlertCircle, CheckCircle2, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function NewProductPage() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  
  // GALERIA DE IMAGENS - Aumentado para 6
  const [images, setImages] = useState<{file: File | null, preview: string}[]>([])
  
  // CAMPOS DO PRODUTO
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [materialFinish, setMaterialFinish] = useState('OURO 18K')
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  
  const FINISH_OPTIONS = [
    'OURO 18K', 'PRATA', 'PRATA 925', 'OURO ROSE', 'RODIO BRANCO', 'RODIO NEGRO'
  ]

  // CAMPOS FINANCEIROS E ESTOQUE
  const [costPrice, setCostPrice] = useState<string>('')
  const [margin, setMargin] = useState<string>('100')
  const [salePrice, setSalePrice] = useState<string>('')
  const [stock, setStock] = useState<string>('1')

  const router = useRouter()
  const supabase = createClient()

  const checkConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id').limit(1)
      if (error) throw error
      setDbStatus('ok')
    } catch (err) {
      console.error('Erro de conexão:', err)
      setDbStatus('error')
    }
  }, [supabase])

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }, [supabase])

  useEffect(() => {
    checkConnection()
    loadCategories()
  }, [checkConnection, loadCategories])

  useEffect(() => {
    const cost = parseFloat(costPrice) || 0
    const m = parseFloat(margin) || 0
    if (cost > 0) {
      const finalPrice = cost + (cost * (m / 100))
      setSalePrice(finalPrice.toFixed(2))
    }
  }, [costPrice, margin])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImages(prev => {
          if (prev.length >= 6) return prev
          return [...prev, { file, preview: event.target?.result as string }]
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const compressImage = async (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.src = base64Str
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        let width = img.width
        let height = img.height
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
    })
  }

  const generateAIDescription = async () => {
    if (images.length === 0) return
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
      if (data.error) throw new Error(data.error)
      if (data.name) setName(data.name.toUpperCase())
      setDescription(data.description ? data.description.toUpperCase() : '')
      if (data.category) {
        const foundCat = categories.find(c => 
          c.name.toLowerCase().includes(data.category.toLowerCase()) ||
          data.category.toLowerCase().includes(c.name.toLowerCase())
        )
        if (foundCat) setCategory(foundCat.id)
      }
    } catch {
      setAiError("IA SOBRECARREGADA. CONTINUE MANUALMENTE. ✨")
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (images.length === 0 || !name || !salePrice || !category) {
      alert('POR FAVOR, PREENCHA TUDO E ADICIONE UMA FOTO. 💎')
      return
    }
    setIsSaving(true)
    try {
      const uploadedUrls: string[] = []
      for (const img of images) {
        if (img.file) {
          const compressedBase64 = await compressImage(img.preview)
          const res = await fetch(compressedBase64)
          const blob = await res.blob()
          const compressedFile = new File([blob], img.file.name, { type: 'image/jpeg' })
          const formData = new FormData()
          formData.append('file', compressedFile)
          formData.append('bucket', 'products')
          const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
          const uploadData = await uploadRes.json()
          if (uploadData.url) uploadedUrls.push(uploadData.url)
        }
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')

      const productData = {
        name: name.toUpperCase(),
        price: parseFloat(salePrice),
        stock_quantity: parseInt(stock) || 0,
        category_id: category,
        description: `${description.toUpperCase()}\n\n---\nDATA:{"finish": "${materialFinish}", "cost": ${parseFloat(costPrice) || 0}}`,
        image_url: uploadedUrls[0] || '',
        user_id: user.id // 💎 NEXUS: VÍNCULO OBRIGATÓRIO DE DONO
      }
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer LAPIDADO_ADMIN_2026` },
        body: JSON.stringify({ table: 'products', data: productData })
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      
      alert('JOIA SALVA COM SUCESSO! 💎✨')
      
      // ✨ MÁGICA: LIMPAR CAMPOS PARA PRÓXIMO CADASTRO
      setName('')
      setDescription('')
      setCostPrice('')
      setSalePrice('')
      setImages([])
      setAiError(null)
      setStock('1')
      // Mantemos a categoria e o acabamento selecionados para agilizar o próximo cadastro
      
      router.refresh()
    } catch (err: unknown) {
      alert('ERRO AO SALVAR: ' + (err as Error).message.toUpperCase())
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

      <div className="flex justify-center mb-8">
        {dbStatus === 'ok' && <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-[8px] font-black uppercase text-green-600 tracking-widest shadow-sm border border-green-100"><CheckCircle2 size={10} /> Sistema Online</div>}
        {dbStatus === 'error' && <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500 text-[8px] font-black uppercase text-white tracking-widest shadow-lg animate-bounce"><AlertCircle size={10} /> Erro de Conexão</div>}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* GALERIA */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-[16px] overflow-hidden border border-rose-100">
                <Image src={img.preview} alt="Preview" className="object-cover" fill />
                <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-rose-500 shadow-sm"><X size={10} /></button>
                {index === 0 && <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-brand-primary text-white text-[5px] font-black uppercase rounded-full">Principal</div>}
              </div>
            ))}
            {images.length < 6 && (
              <label className="cursor-pointer aspect-square rounded-[16px] border border-dashed border-rose-200 flex flex-col items-center justify-center bg-white hover:bg-rose-50/50 transition-all">
                <Plus size={14} className="text-brand-secondary" />
                <span className="text-[6px] font-black text-brand-secondary uppercase tracking-widest">Foto</span>
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" multiple />
              </label>
            )}
          </div>
          
          {/* MÁGICA - AGORA NA COR PRIMÁRIA + DIAMANTE */}
          <div className="space-y-2">
            <button type="button" disabled={images.length === 0 || aiLoading} onClick={generateAIDescription} className="w-full py-4 rounded-xl bg-brand-primary text-white text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
              {aiLoading ? <Loader2 className="animate-spin" size={16} /> : <><Gem size={16} /> <span>Mágica Lapidado</span></>}
            </button>
            {aiError && (
              <div className="bg-rose-50 text-rose-500 text-[8px] font-black uppercase p-3 rounded-xl border border-rose-100 text-center animate-pulse">
                {aiError}
              </div>
            )}
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="space-y-3 bg-white/60 p-5 rounded-[30px] border border-rose-50 shadow-sm">
          <div>
            <label className="text-[7px] font-black text-brand-secondary uppercase tracking-[0.1em] mb-1 ml-1 block">Acabamento / Banho</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {FINISH_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMaterialFinish(option)}
                  className={`px-3 py-1.5 rounded-full text-[7px] font-black transition-all ${
                    materialFinish === option 
                      ? 'bg-brand-primary text-white shadow-md scale-105' 
                      : 'bg-white text-brand-secondary border border-rose-100 hover:bg-rose-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[7px] font-black text-brand-secondary uppercase tracking-[0.1em] mb-1 ml-1 block">Nome da Peça</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full px-4 py-2.5 rounded-xl bg-white border border-rose-100 focus:border-brand-primary outline-none font-bold text-[10px] text-brand-primary" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[7px] font-black text-brand-secondary uppercase mb-1 ml-1 block">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white border border-rose-100 text-[9px] font-bold text-brand-primary outline-none appearance-none cursor-pointer">
                <option value="">SELECIONE...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[7px] font-black text-brand-secondary uppercase mb-1 ml-1 block">Estoque</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white border border-rose-100 font-bold text-brand-primary text-[9px]" />
            </div>
          </div>

          {/* FINANCEIRO - COR SECUNDÁRIA NO PREÇO FINAL */}
          <div className="p-4 rounded-[20px] bg-rose-50/40 border border-rose-100/50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[6px] font-bold text-brand-secondary uppercase mb-1 block">Custo (R$)</label>
                <input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-rose-100 font-bold text-[9px]" />
              </div>
              <div>
                <label className="text-[6px] font-bold text-brand-secondary uppercase mb-1 block">Lucro (%)</label>
                <input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-rose-100 font-bold text-[9px]" />
              </div>
            </div>
            
            <div className="pt-2 border-t border-rose-100">
               <label className="text-[7px] font-black text-brand-primary uppercase tracking-widest mb-1 block text-center">Preço Final de Venda</label>
               <div className="relative">
                 <input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full px-4 py-4 rounded-xl bg-brand-secondary text-white text-xl font-black outline-none shadow-sm text-center" />
                 <Pencil size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50" />
               </div>
            </div>
          </div>

          <div>
            <label className="text-[7px] font-black text-brand-secondary uppercase mb-1 ml-1 block">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value.toUpperCase())} rows={2} className="w-full px-4 py-2.5 rounded-xl bg-white border border-rose-100 text-[8px] uppercase font-bold text-brand-primary outline-none" />
          </div>

          {/* BOTÃO SALVAR - COR PRIMÁRIA */}
          <button type="submit" disabled={isSaving || dbStatus === 'error'} className="w-full py-4 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> <span>Salvar Peça</span></>}
          </button>
        </div>
      </form>
    </div>
  )
}
