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
  
  // GALERIA DE IMAGENS - Aumentado para 6
  const [images, setImages] = useState<{file: File | null, preview: string}[]>([])
  
  // CAMPOS DO PRODUTO
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [materialFinish, setMaterialFinish] = useState('OURO 18K')
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [pricingRules, setPricingRules] = useState<{globalMarkup: number, categoryMarkups: Record<string, number>}>({
    globalMarkup: 100,
    categoryMarkups: {}
  })
  
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
      const { error } = await supabase.from('categories').select('id').limit(1)
      if (error) throw error
      setDbStatus('ok')
    } catch (err) {
      console.error('Erro de conexão:', err)
      setDbStatus('error')
    }
  }, [supabase])

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Categorias
    const { data: catData } = await supabase.from('categories').select('*').order('name')
    if (catData) setCategories(catData)

    // Regras de Precificação
    const { data: brandingData } = await supabase.from('branding').select('notes').eq('user_id', user.id).maybeSingle()
    if (brandingData?.notes && brandingData.notes.includes('PRICING_RULES:')) {
      try {
        const rules = JSON.parse(brandingData.notes.split('PRICING_RULES:')[1])
        setPricingRules(rules)
        setMargin(rules.globalMarkup.toString())
      } catch (e) { console.error('Erro pricing rules:', e) }
    }
  }, [supabase])

  useEffect(() => {
    checkConnection()
    loadData()
  }, [checkConnection, loadData])

  // ✨ MÁGICA: Aplicar markup da categoria selecionada
  useEffect(() => {
    if (category && pricingRules.categoryMarkups[category]) {
      setMargin(pricingRules.categoryMarkups[category].toString())
    } else {
      setMargin(pricingRules.globalMarkup.toString())
    }
  }, [category, pricingRules])

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
        const MAX_WIDTH = 800 // 💎 NEXUS: Equilíbrio perfeito entre detalhe e economia
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
        resolve(canvas.toDataURL('image/jpeg', 0.6)) // 💎 NEXUS: Qualidade 0.6 para visão nítida
      }
    })
  }

  const [aiUsed, setAiUsed] = useState(false)

  const generateAIDescription = async () => {
    if (images.length === 0 || aiLoading || aiUsed) return
    
    // 💎 NEXUS: ECONOMIA DE TOKENS - Só permite gerar se o campo nome estiver vazio ou se for forçado
    if (name && !confirm("VOCÊ JÁ TEM UM NOME DEFINIDO. DESEJA USAR A IA E CONSUMIR CRÉDITOS?")) return

    setAiLoading(true)
    setAiError(null)
    try {
      const compressed = await compressImage(images[0].preview)
      const response = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressed })
      })
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('AI SERVER ERROR (HTML):', text)
        throw new Error(`O motor de IA retornou um erro inesperado. Verifique a configuração da Vercel.`)
      }

      if (response.status === 429) {
        throw new Error("Nossa IA está lapidando muitos textos agora. ✨ Aguarde alguns segundos e tente novamente.")
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(`${data.error}${data.details ? `: ${data.details}` : ''}`)
      }
      if (data.name) setName(data.name.toUpperCase())
      setDescription(data.description ? data.description.toUpperCase() : '')
      if (data.category) {
        const foundCat = categories.find(c => 
          c.name.toLowerCase().includes(data.category.toLowerCase()) ||
          data.category.toLowerCase().includes(c.name.toLowerCase())
        )
        if (foundCat) setCategory(foundCat.id)
      }
      setAiUsed(true) // 🔒 TRAVA DE SEGURANÇA ATIVADA
    } catch (err: unknown) {
      const error = err as Error
      console.error('DETALHE DO ERRO IA:', error.message)
      setAiError(error.message.toUpperCase() || "IA SOBRECARREGADA. CONTINUE MANUALMENTE. ✨")
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
        cost_price: parseFloat(costPrice) || 0, // 💎 NEXUS: Gravando na coluna real
        stock_quantity: parseInt(stock) || 0,
        category_id: category,
        description: description.toUpperCase(),
        image_url: uploadedUrls[0] || '',
        user_id: user.id
      }
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer LAPIDADO_ADMIN_2026` },
        body: JSON.stringify({ table: 'products', data: productData })
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('SERVER ERROR (HTML):', text)
        throw new Error(`O servidor retornou um erro inesperado (HTML). Verifique se as variáveis do Supabase estão configuradas na Vercel.`)
      }

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
        {dbStatus === 'error' && <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500 text-[8px] font-black uppercase text-white tracking-widest shadow-lg animate-bounce"><AlertCircle size={10} /> Erro de Conexão</div>
          <p className="text-[6px] text-rose-400 uppercase font-bold mt-1 tracking-widest">Confirme as chaves do Supabase na Vercel 💎</p>
        </div>}
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
              {aiLoading ? <><Loader2 className="animate-spin" size={16} /> <span>LAPIDANDO... ✨</span></> : <><Gem size={16} /> <span>Mágica Lapidado</span></>}
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

          {/* FINANCEIRO - GESTÃO DE LUCRO & DASHBOARD */}
          <div className="p-6 rounded-[35px] bg-white border border-brand-secondary/10 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[7px] font-black text-brand-secondary/40 uppercase ml-2">Custo da Peça (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={costPrice} 
                  onChange={(e) => setCostPrice(e.target.value)} 
                  className="w-full px-5 py-3 rounded-2xl bg-brand-secondary/5 text-sm font-bold text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" 
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[7px] font-black text-brand-secondary/40 uppercase ml-2">Lucro Aplicado (%)</label>
                <div className="w-full px-5 py-3 rounded-2xl bg-amber-50 border border-amber-100 text-sm font-black text-amber-700 flex justify-between items-center">
                  <span>{margin}%</span>
                  <TrendingUp size={14} className="opacity-40" />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-brand-secondary/5">
               <label className="text-[8px] font-black text-brand-primary uppercase tracking-[0.3em] mb-2 block text-center">Preço Final de Venda</label>
               <div className="relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-primary/20 font-bold text-lg">R$</span>
                 <input 
                   type="number" 
                   step="0.01" 
                   value={salePrice} 
                   onChange={(e) => setSalePrice(e.target.value)} 
                   className="w-full pl-14 pr-6 py-5 rounded-[25px] bg-brand-primary text-white text-3xl font-black outline-none shadow-xl shadow-brand-primary/20 text-center" 
                 />
               </div>
               <p className="text-[6px] font-bold text-center text-brand-secondary/40 uppercase mt-3 tracking-widest">Este valor alimenta seu lucro no Dashboard 💎</p>
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
