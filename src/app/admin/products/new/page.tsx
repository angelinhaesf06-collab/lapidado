'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gem, Loader2, Check, Calculator, PackageOpen, Sparkles, X, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function NewProductPage() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  
  // GALERIA DE IMAGENS
  const [images, setImages] = useState<{file: File | null, preview: string}[]>([])
  
  // CAMPOS DO PRODUTO
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [materialFinish, setMaterialFinish] = useState('OURO 18K')
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  
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

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }, [supabase])

  async function handleSaveCategory() {
    if (!newCategoryName) return
    setIsAddingCategory(true)
    try {
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          table: 'categories', 
          data: { name: newCategoryName.toUpperCase() } 
        })
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      
      await loadCategories()
      setNewCategoryName('')
      setIsAddingCategory(false)
      alert('CATEGORIA ADICIONADA! 💎')
    } catch (err: unknown) {
      alert('ERRO AO SALVAR CATEGORIA: ' + (err as Error).message.toUpperCase())
      setIsAddingCategory(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

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
        setImages(prev => [...prev, { file, preview: event.target?.result as string }])
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
      alert('POR FAVOR, PREENCHA TUDO E ADICIONE PELO MENOS UMA FOTO. 💎')
      return
    }
    setIsSaving(true)
    setUploadProgress(10)
    try {
      const uploadedUrls: string[] = []

      // Upload de todas as imagens em lote com compressão
      const totalImages = images.filter(img => img.file).length
      let currentImage = 0

      for (const img of images) {
        if (img.file) {
          currentImage++
          const progressBase = 10 + ((currentImage / totalImages) * 60)
          setUploadProgress(Math.round(progressBase))

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
      
      setUploadProgress(80)
      
      // Armazenamento Resiliente: Se as colunas não existirem, guardamos os dados na descrição
      // de forma que o sistema consiga ler depois sem quebrar o banco.
      const productData = {
        name: name.toUpperCase(),
        price: parseFloat(salePrice),
        stock_quantity: parseInt(stock) || 0,
        category_id: category,
        description: `${description.toUpperCase()}\n\n---\nDATA:{"cost":${costPrice || 0},"finish":"${materialFinish}"}`,
        image_url: uploadedUrls[0],
      }

      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer LAPIDADO_ADMIN_2026`
        },
        body: JSON.stringify({ table: 'products', data: productData })
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      
      setUploadProgress(100)
      alert('JOIA E GALERIA SALVAS COM SUCESSO! 💎✨')
      router.push('/admin')
      router.refresh()
    } catch (err: unknown) {
      alert('ERRO AO SALVAR: ' + (err as Error).message.toUpperCase())
    } finally {
      setIsSaving(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 pb-20">
      {isSaving && (
        <div className="fixed inset-0 bg-white/90 z-50 flex flex-col items-center justify-center p-10 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-8 text-center">
            <Gem className="mx-auto text-brand-primary animate-bounce" size={48} />
            <h3 className="text-xl font-black text-brand-primary uppercase tracking-[0.2em]">Lapidando sua Joia...</h3>
            <div className="h-4 w-full bg-rose-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-brand-primary transition-all duration-500 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[10px] font-black text-brand-secondary uppercase tracking-widest italic">
              {uploadProgress < 80 ? 'SUBINDO FOTOS EM ALTA QUALIDADE...' : 'SINCRONIZANDO COM O BANCO...'}
            </p>
          </div>
        </div>
      )}      <div className="text-center mb-12">
        <h1 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.4em] mb-4">CATÁLOGO LAPIDADO</h1>
        <h2 className="text-3xl font-bold text-brand-primary uppercase tracking-tight">ACERVO MULTIFOTOS</h2>
        <p className="text-[#7a5c58] text-[10px] mt-4 font-black uppercase tracking-[0.1em]">&quot;ADICIONE VÁRIOS ÂNGULOS PARA ENCANTAR SUA CLIENTE.&quot; 💎</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Lado Esquerdo - Galeria e IA */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-[40px] overflow-hidden border-2 border-brand-secondary/10 group shadow-md hover:shadow-xl transition-all">
                <Image src={img.preview} alt="Preview" className="object-cover" fill />
                <button type="button" onClick={() => removeImage(index)} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                  <X size={16} />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-brand-primary/90 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                    Principal
                  </div>
                )}
              </div>
            ))}
            
            {images.length < 6 && (
              <label className="cursor-pointer aspect-square rounded-[40px] border-2 border-dashed border-brand-secondary/20 flex flex-col items-center justify-center gap-3 bg-white hover:bg-rose-50/30 transition-all group">
                <div className="p-4 rounded-full bg-brand-secondary/5 group-hover:scale-110 transition-transform">
                  <Plus size={24} className="text-brand-secondary" />
                </div>
                <p className="text-[9px] font-black text-brand-secondary uppercase tracking-widest">Adicionar Foto</p>
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" multiple />
              </label>
            )}
          </div>
          
          <button type="button" disabled={images.length === 0 || aiLoading} onClick={generateAIDescription} className="w-full py-6 rounded-[32px] bg-brand-primary text-white font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl hover:opacity-90 transition-all disabled:opacity-50">
            {aiLoading ? <Loader2 className="animate-spin" size={24} /> : <><Sparkles size={24} /> <span>MÁGICA LAPIDADO (VIA FOTO 1)</span></>}
          </button>
          
          {aiError && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl text-rose-800 text-[10px] font-black text-center animate-pulse tracking-widest uppercase">
              {aiError}
            </div>
          )}
        </div>

        {/* Lado Direito - Formulário */}
        <div className="space-y-6 bg-white p-10 rounded-[60px] border border-rose-50 shadow-sm relative">
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3 ml-2 block">ACABAMENTO / BANHO</label>
              <div className="flex flex-wrap gap-2">
                {FINISH_OPTIONS.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMaterialFinish(option)}
                    className={`px-4 py-2 rounded-full text-[9px] font-black transition-all ${
                      materialFinish === option 
                        ? 'bg-brand-primary text-white shadow-md scale-105' 
                        : 'bg-rose-50 text-brand-secondary hover:bg-rose-100'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3 ml-2 block">NOME DA JOIA</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full px-8 py-5 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none uppercase font-bold text-brand-primary transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3 ml-2 block">CATEGORIA</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-6 py-5 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none uppercase font-bold text-brand-primary appearance-none cursor-pointer mb-2">
                <option value="">SELECIONE...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
              </select>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="NOVA CATEGORIA..." 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-brand-secondary/5 border border-brand-secondary/10 outline-none text-[10px] font-bold uppercase"
                />
                <button 
                  type="button"
                  onClick={handleSaveCategory}
                  disabled={isAddingCategory || !newCategoryName}
                  className="px-4 py-2 bg-brand-secondary text-white rounded-xl text-[10px] font-black disabled:opacity-50"
                >
                  {isAddingCategory ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3 ml-2 block">ESTOQUE INICIAL</label>
              <div className="relative">
                <PackageOpen className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-secondary" size={18} />
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full pl-16 pr-6 py-5 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none font-bold text-brand-primary" />
              </div>
            </div>
          </div>

          {/* Seção Financeira */}
          <div className="p-8 rounded-[40px] bg-rose-50/30 border border-rose-100/50 space-y-6">
            <h4 className="text-[9px] font-black text-brand-secondary uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
              <Calculator size={14} /> Inteligência Financeira
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-2 block ml-2">CUSTO (R$)</label>
                <input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-brand-secondary outline-none font-bold text-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-2 block ml-2">MARGEM (%)</label>
                <input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-brand-secondary outline-none font-bold text-brand-primary" />
              </div>
            </div>

            <div className="pt-4 border-t border-rose-100">
               <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2 block ml-2">PREÇO DE VENDA FINAL</label>
               <input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full px-8 py-6 rounded-[28px] bg-brand-primary text-white text-2xl font-black outline-none shadow-lg text-center" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3 ml-2 block">DESCRIÇÃO DA JOIA</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value.toUpperCase())} className="w-full px-8 py-5 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none resize-none uppercase text-xs leading-relaxed text-[#7a5c58]" />
          </div>

          <button type="submit" disabled={isSaving} className="w-full py-6 rounded-[32px] bg-brand-primary text-white font-black uppercase tracking-widest shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 mt-4">
            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <><Check size={24} /> <span>SALVAR JOIA E GALERIA</span></>}
          </button>
        </div>
      </form>
    </div>
  )
}
