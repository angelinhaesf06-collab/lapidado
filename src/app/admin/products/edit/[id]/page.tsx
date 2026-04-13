'use client'

import { useState, useEffect, use } from 'react'
import { Gem, Loader2, Check, Calculator, PackageOpen, Sparkles, X, Plus, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
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

  const FINISH_OPTIONS = [
    'OURO 18K', 'PRATA', 'PRATA 925', 'OURO ROSE', 'RODIO BRANCO', 'RODIO NEGRO'
  ]

  const router = useRouter()
  const supabase = createClient()

  // Carregar dados iniciais
  useEffect(() => {
    async function loadData() {
      setFetching(true)
      const { data: cats } = await supabase.from('categories').select('*').order('name')
      if (cats) setCategories(cats)

      const { data: prod, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (error) {
        alert('ERRO AO CARREGAR JOIA: ' + error.message)
        router.push('/admin/products')
        return
      }

      if (prod) {
        setName(prod.name)
        // Tentar extrair custo e banho da descrição se as colunas falharem
        const descMatch = prod.description?.match(/---[\s\S]*DATA:({.*})/)
        if (descMatch) {
          try {
            const extraData = JSON.parse(descMatch[1])
            setCostPrice(extraData.cost?.toString() || '')
            setMaterialFinish(extraData.finish || 'OURO 18K')
            setDescription(prod.description.split('\n\n---')[0])
          } catch(e) {
            setDescription(prod.description)
          }
        } else {
          setDescription(prod.description)
          setMaterialFinish(prod.material_finish || 'OURO 18K')
        }
        
        setCategory(prod.category_id)
        setSalePrice(prod.price.toString())
        setStock(prod.stock_quantity.toString())
        if (prod.image_url) {
          setImages([{ file: null, preview: prod.image_url }])
        }
      }
      setFetching(false)
    }
    loadData()
  }, [id])

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
      
      const productData = {
        name: name.toUpperCase(),
        price: parseFloat(salePrice),
        // cost_price: parseFloat(costPrice) || 0,
        stock_quantity: parseInt(stock) || 0,
        category_id: category,
        // material_finish: materialFinish,
        description: description.toUpperCase(),
        image_url: finalImageUrl,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase.from('products').update(productData).eq('id', id)
      if (error) {
        // Fallback para a rota de API segura se o RLS bloquear o update direto
        const response = await fetch('/api/admin/save', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer LAPIDADO_ADMIN_2026`
          },
          body: JSON.stringify({ table: 'products', data: productData, id })
        })
        const result = await response.json()
        if (!result.success) throw new Error(result.error)
      }
      
      alert('JOIA ATUALIZADA COM SUCESSO! 💎✨')
      router.push('/admin/products')
      router.refresh()
    } catch (err: any) {
      alert('ERRO AO ATUALIZAR: ' + err.message.toUpperCase())
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#c99090]" size={40} /></div>

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 pb-20">
      <div className="mb-12">
        <Link href="/admin/products" className="flex items-center gap-2 text-[10px] font-black text-[#c99090] uppercase tracking-widest mb-4 hover:ml-2 transition-all">
          <ArrowLeft size={14} /> Voltar para Vitrine
        </Link>
        <h1 className="text-3xl font-bold text-[#4a322e] uppercase tracking-tight">Editar Joia</h1>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="relative aspect-square rounded-[40px] overflow-hidden border-2 border-[#c99090]/10 shadow-md">
            {images[0] ? (
              <img src={images[0].preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-200 uppercase text-[10px] font-black">Sem Foto</div>
            )}
            <label className="absolute bottom-6 right-6 p-4 bg-white rounded-full shadow-xl cursor-pointer hover:scale-110 transition-all text-[#c99090]">
              <Plus size={24} />
              <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
            </label>
          </div>
        </div>

        <div className="space-y-6 bg-white p-10 rounded-[60px] border border-rose-50 shadow-sm">
          
          <div>
            <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-3 ml-2 block">ACABAMENTO / BANHO</label>
            <div className="flex flex-wrap gap-2">
              {FINISH_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMaterialFinish(option)}
                  className={`px-4 py-2 rounded-full text-[9px] font-black transition-all ${
                    materialFinish === option 
                      ? 'bg-[#4a322e] text-white shadow-md scale-105' 
                      : 'bg-rose-50 text-[#c99090] hover:bg-rose-100'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-3 ml-2 block">NOME DA JOIA</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full px-8 py-5 rounded-3xl bg-rose-50/20 border-2 border-transparent focus:border-[#c99090] outline-none font-bold text-[#4a322e] uppercase" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-3 ml-2 block">CATEGORIA</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-6 py-5 rounded-3xl bg-rose-50/20 border-2 border-transparent focus:border-[#c99090] outline-none font-bold text-[#4a322e]">
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-3 ml-2 block">ESTOQUE</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-8 py-5 rounded-3xl bg-rose-50/20 border-2 border-transparent focus:border-[#c99090] outline-none font-bold text-[#4a322e]" />
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-rose-50/30 border border-rose-100/50">
            <label className="text-[10px] font-black text-[#4a322e] uppercase tracking-widest mb-4 block ml-2">PREÇO DE VENDA (R$)</label>
            <input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full px-8 py-6 rounded-[28px] bg-[#4a322e] text-white text-2xl font-black outline-none shadow-lg text-center" />
          </div>

          <div>
            <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-3 ml-2 block">DESCRIÇÃO</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value.toUpperCase())} className="w-full px-8 py-5 rounded-3xl bg-rose-50/20 border-2 border-transparent focus:border-[#c99090] outline-none resize-none text-xs text-[#7a5c58] uppercase" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-6 rounded-[32px] bg-[#4a322e] text-white font-black uppercase tracking-widest shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={24} /> : <><Check size={24} /> <span>SALVAR ALTERAÇÕES</span></>}
          </button>
        </div>
      </form>
    </div>
  )
}
