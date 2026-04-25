'use client'

import { useState, useEffect, Suspense } from 'react'
import { Loader2, Check, Plus, ArrowLeft } from 'lucide-react'
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

  // ... (keep useEffect for data loading)

  useEffect(() => {
    const cost = parseFloat(costPrice) || 0
    const m = parseFloat(margin) || 0
    if (cost > 0 && !fetching) {
      setSalePrice((cost + (cost * (m / 100))).toFixed(2))
    }
  }, [costPrice, margin, fetching])

  const FINISH_OPTIONS = [
    'OURO 18K', 'PRATA', 'PRATA 925', 'OURO ROSE', 'RODIO BRANCO', 'RODIO NEGRO'
  ]

  const router = useRouter()
  const supabase = createClient()

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
        
        const descMatch = prod.description?.match(/---[\s\S]*DATA:({.*})/)
        let extractedDescription = prod.description || ''
        let extractedFinish = prod.material_finish || 'OURO 18K'

        if (descMatch) {
          try {
            const extraData = JSON.parse(descMatch[1])
            extractedFinish = prod.material_finish || extraData.finish || 'OURO 18K'
            if (!prod.cost_price && extraData.cost) setCostPrice(extraData.cost.toString())
            extractedDescription = prod.description?.split('\n\n---')[0] || ''
          } catch {}
        }
        
        setDescription(extractedDescription)
        setMaterialFinish(extractedFinish)
        setCategory(prod.category_id)
        setSalePrice(prod.price.toString())
        
        const sPrice = prod.price || 0
        if (cost > 0) {
          setMargin(((sPrice - cost) / cost * 100).toFixed(0))
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
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (uploadData.url) finalImageUrl = uploadData.url
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')

      const productData = {
        name: name.toUpperCase(),
        price: parseFloat(salePrice) || 0,
        cost_price: parseFloat(costPrice) || 0,
        stock_quantity: parseInt(stock) || 0,
        category_id: category || categories[0]?.id,
        description: description.toUpperCase(),
        material_finish: materialFinish,
        image_url: finalImageUrl,
        user_id: user.id
      }

      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer LAPIDADO_ADMIN_2026`
        },
        body: JSON.stringify({ table: 'products', data: productData, id })
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text()
        console.error('Erro detalhado:', errorText)
        throw new Error('O servidor retornou um erro inesperado (HTML). Verifique as variáveis de ambiente no painel da Vercel.')
      }

      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      
      alert('JOIA ATUALIZADA COM SUCESSO! 💎✨')
      router.push('/admin/products')
      router.refresh()
    } catch (err: unknown) {
      alert('ERRO AO ATUALIZAR: ' + (err as Error).message.toUpperCase())
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 pb-20">
      <div className="mb-12">
        <Link href="/admin/products" className="flex items-center gap-2 text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-4 hover:ml-2 transition-all">
          <ArrowLeft size={14} /> Voltar para Vitrine
        </Link>
        <h1 className="text-3xl font-bold text-brand-primary uppercase tracking-tight">Editar Joia</h1>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="relative aspect-square rounded-[40px] overflow-hidden border-2 border-brand-secondary/10 shadow-md">
            {images[0] ? (
              <Image src={images[0].preview} alt="Preview" className="object-cover" fill sizes="(max-width: 768px) 100vw, 50vw" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-secondary/5 text-brand-secondary uppercase text-[10px] font-black">Sem Foto</div>
            )}
            <label className="absolute bottom-6 right-6 p-4 bg-white rounded-full shadow-xl cursor-pointer hover:scale-110 transition-all text-brand-secondary">
              <Plus size={24} />
              <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
            </label>
          </div>
        </div>

        <div className="space-y-6 bg-white p-10 rounded-[60px] border border-brand-secondary/10 shadow-sm">
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
                      : 'bg-brand-secondary/5 text-brand-secondary hover:bg-brand-secondary/10'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3 ml-2 block">NOME DA JOIA</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full px-8 py-5 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none font-bold text-brand-primary uppercase" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3 ml-2 block">CATEGORIA</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-6 py-5 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none font-bold text-brand-primary">
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3 ml-2 block">ESTOQUE</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-8 py-5 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none font-bold text-brand-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3 ml-2 block">CUSTO (R$)</label>
              <input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full px-8 py-5 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none font-bold text-brand-primary" />
              <div className="mt-2 relative">
                <input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} className="w-full p-2.5 rounded-xl bg-amber-50 text-[10px] font-black text-amber-700 text-center outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-amber-700/40">% MARGEM</span>
              </div>
            </div>
            <div className="p-8 rounded-[40px] bg-brand-secondary/5 border border-brand-secondary/10">
              <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-4 block ml-2">PREÇO DE VENDA (R$)</label>
              <input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full px-8 py-6 rounded-[28px] bg-brand-primary text-white text-2xl font-black outline-none shadow-lg text-center" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3 ml-2 block">DESCRIÇÃO</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value.toUpperCase())} className="w-full px-8 py-5 rounded-3xl bg-brand-secondary/5 border-2 border-transparent focus:border-brand-secondary outline-none resize-none text-xs text-brand-primary/60 uppercase" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-6 rounded-[32px] bg-brand-primary text-white font-black uppercase tracking-widest shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={24} /> : <><Check size={24} /> <span>SALVAR ALTERAÇÕES</span></>}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function EditProductPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>}>
            <EditProductContent />
        </Suspense>
    )
}
