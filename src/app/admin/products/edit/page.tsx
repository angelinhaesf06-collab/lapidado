'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { Loader2, Check, Plus, ArrowLeft, Gem, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  category_id: string;
  cost_price?: number;
  material_finish?: string;
}

function EditProductContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  
  // GALERIA E DADOS
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

  const router = useRouter()
  const supabase = createClient()

  const FINISH_OPTIONS = ['OURO 18K', 'PRATA', 'PRATA 925', 'OURO ROSE', 'RODIO BRANCO', 'RODIO NEGRO']

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

  // Carregar dados iniciais
  useEffect(() => {
    if (!id) {
        router.push('/admin/products')
        return
    }

    async function loadData() {
      setFetching(true)
      const { data: cats } = await supabase.from('categories').select('*').order('name')
      if (cats) setCategories(cats)

      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (error) {
        alert('ERRO AO CARREGAR JOIA: ' + error.message)
        router.push('/admin/products')
        return
      }

      const prod = data as ProductData
      if (prod) {
        setName(prod.name)
        const cost = prod.cost_price || 0
        setCostPrice(cost.toString())
        setDescription(prod.description || '')
        setMaterialFinish(prod.material_finish || 'OURO 18K')
        setCategory(prod.category_id)
        setSalePrice(prod.price.toString())
        
        if (cost > 0) {
          setMargin(((prod.price - cost) / cost * 100).toFixed(0))
        }

        setStock(prod.stock_quantity.toString())
        if (prod.image_url) {
          setImages([{ file: null, preview: prod.image_url }])
        }
      }
      setFetching(false)
    }
    loadData()
  }, [id, router, supabase])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImages([{ file, preview: event.target?.result as string }])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let finalImageUrl = images[0]?.preview

      if (images[0]?.file) {
        const formData = new FormData()
        formData.append('file', images[0].file)
        const uploadRes = await fetch('/api/admin/upload', { 
          method: 'POST', 
          headers: { 'Authorization': 'Bearer LAPIDADO_ADMIN_2026' },
          body: formData 
        })
        const uploadData = await uploadRes.json()
        if (uploadData.url) finalImageUrl = uploadData.url
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada.')

      const productData = {
        name: name.toUpperCase(),
        price: parseFloat(salePrice) || 0,
        cost_price: parseFloat(costPrice) || 0,
        stock_quantity: parseInt(stock) || 0,
        category_id: category,
        description: description.toUpperCase(),
        material_finish: materialFinish,
        image_url: finalImageUrl,
        user_id: user.id
      }

      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'products', id, data: productData })
      })


      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      
      alert('JOIA ATUALIZADA! 💎')
      router.push('/admin/products')
    } catch (err: any) {
      alert('ERRO: ' + err.message.toUpperCase())
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-secondary" size={32} /></div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 pb-20">
      <div className="mb-8 md:mb-12">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em] mb-4 hover:ml-2 transition-all">
          <ArrowLeft size={14} /> Voltar à Vitrine
        </Link>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight uppercase text-brand-primary">Editar Joia</h2>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          <div className="relative aspect-square rounded-[30px] md:rounded-[40px] overflow-hidden border border-rose-100 shadow-md">
            {images[0] ? (
              <Image src={images[0].preview} alt="" className="object-cover" fill sizes="(max-width: 768px) 100vw, 50vw" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-secondary/5 text-brand-secondary uppercase text-[10px] font-black tracking-widest">Sem Foto</div>
            )}
            <label className="absolute bottom-6 right-6 p-4 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl cursor-pointer hover:scale-110 transition-all text-brand-secondary border border-rose-50">
              <Plus size={24} />
              <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
            </label>
          </div>
          <p className="text-center text-[9px] font-black text-brand-secondary uppercase tracking-[0.4em]">Toque no + para trocar a foto principal</p>
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
            <input type="text" value={name} onChange={e => setName(e.target.value.toUpperCase())} className="w-full px-5 py-3.5 rounded-2xl border border-rose-100 bg-rose-50/10 font-bold text-[11px] text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-brand-secondary uppercase ml-1 tracking-widest">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl border border-rose-100 bg-rose-50/10 text-[10px] font-bold text-brand-primary outline-none">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-brand-secondary uppercase ml-1 tracking-widest">Estoque</label>
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl border border-rose-100 bg-rose-50/10 font-bold text-brand-primary text-[10px] outline-none" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-brand-primary/5 border border-brand-primary/10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-brand-primary uppercase ml-1 tracking-widest">Custo R$</label>
                <input type="number" step="0.01" value={costPrice} onChange={e => handleCostChange(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-white border border-brand-primary/10 text-[11px] font-bold text-brand-primary outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-amber-700 uppercase ml-1 tracking-widest">Margem %</label>
                <div className="relative">
                  <input type="number" value={margin} onChange={e => handleMarginChange(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-amber-50 border border-amber-200/50 text-[11px] font-black text-amber-700 text-center outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-700/30">%</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-brand-primary uppercase ml-1 tracking-widest text-center block">Preço Final de Venda</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-white/40 italic">R$</span>
                <input type="number" step="0.01" value={salePrice} onChange={e => handleSalePriceChange(e.target.value)} className="w-full p-5 md:p-6 rounded-2xl bg-brand-primary text-white text-3xl font-black text-center outline-none shadow-xl" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-brand-secondary uppercase ml-1 tracking-widest">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value.toUpperCase())} rows={3} className="w-full px-5 py-4 rounded-2xl border border-rose-100 bg-rose-50/10 text-[10px] font-bold text-brand-primary outline-none resize-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} SALVAR ALTERAÇÕES
          </button>
        </div>
      </form>
    </div>
  )
}

export default function EditProductPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-secondary" size={32} /></div>}>
      <EditProductContent />
    </Suspense>
  )
}
