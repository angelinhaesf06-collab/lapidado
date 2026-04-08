'use client'

import { useState, useEffect } from 'react'
import { Gem, Loader2, Camera, Plus, Check, Edit2, Calculator, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewProductPage() {
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [costPrice, setCostPrice] = useState<string>('')
  const [markup, setMarkup] = useState<string>('100')
  const [price, setPrice] = useState<string>('')
  const [stock, setStock] = useState<string>('1') // Padrão 1 peça
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from('categories').select('*').order('name')
      if (data) setCategories(data)
    }
    loadCategories()
  }, [])

  useEffect(() => {
    const cost = parseFloat(costPrice) || 0
    const m = parseFloat(markup) || 0
    if (cost > 0) {
      const finalPrice = cost + (cost * (m / 100))
      setPrice(finalPrice.toFixed(2))
    }
  }, [costPrice, markup])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => setImage(event.target?.result as string)
    reader.readAsDataURL(file)
  }

  const generateAIDescription = async () => {
    if (!image) return
    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      if (data.name) setName(data.name.toUpperCase())
      let fullDescription = data.description || ''
      if (data.material) {
        fullDescription = `ACABAMENTO IMPECÁVEL COM BANHO EM ${data.material.toUpperCase()}. ${fullDescription.toUpperCase()}`
      } else {
        fullDescription = fullDescription.toUpperCase()
      }
      setDescription(fullDescription)
      if (data.category) {
        const foundCat = categories.find(c => 
          c.name.toLowerCase().includes(data.category.toLowerCase()) ||
          data.category.toLowerCase().includes(c.name.toLowerCase())
        )
        if (foundCat) setCategory(foundCat.id)
      }
    } catch (err: any) {
      alert(`ERRO TÉCNICO: ${err.message || 'FALHA NA COMUNICAÇÃO COM O GEMINI'}. ✨`)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image || !name || !price || !category) {
      alert('POR FAVOR, PREENCHA TODOS OS CAMPOS E SUBA UMA FOTO DA JOIA. 💎')
      return
    }
    setLoading(true)
    try {
      const base64Data = image.split(',')[1]
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob())
      const fileName = `${Date.now()}-${name.toLowerCase().replace(/ /g, '-')}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('products').upload(fileName, blob)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
      const { error: dbError } = await supabase.from('products').insert([{
        name: name.toUpperCase(),
        cost_price: parseFloat(costPrice) || 0,
        price: parseFloat(price),
        stock_quantity: parseInt(stock) || 0,
        category_id: category,
        description: description.toUpperCase(),
        image_url: publicUrl,
        featured: true
      }])
      if (dbError) throw dbError
      alert('JOIA SALVA COM SUCESSO NO CATÁLOGO! 💎✨')
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      alert('ERRO AO SALVAR A JOIA: ' + err.message.toUpperCase())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="text-center mb-12">
        <h1 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.4em] mb-4 text-brand-secondary">CATÁLOGO LAPIDADO</h1>
        <h2 className="text-3xl font-bold text-[#4a322e] text-brand-primary uppercase tracking-tight">NOVA PEÇA DO CATÁLOGO</h2>
        <p className="text-[#7a5c58] text-[10px] mt-4 font-black uppercase tracking-[0.1em]">"ONDE A TECNOLOGIA ENCONTRA O BRILHO DA SUA CURADORIA." 💎</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className={`relative aspect-square rounded-[60px] overflow-hidden border-2 border-dashed transition-all flex items-center justify-center bg-white ${image ? 'border-transparent shadow-2xl shadow-rose-100' : 'border-rose-100 hover:border-[#c99090]'}`}>
            {image ? <img src={image} alt="PREVIEW" className="w-full h-full object-cover" /> : (
              <label className="cursor-pointer flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-[#c99090]"><Camera size={28} /></div>
                <p className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em]">SUBIR FOTO DA JOIA</p>
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
            )}
            {image && (
              <label className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-[#4a322e] cursor-pointer hover:scale-110 transition-all">
                <Plus size={20} /><input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
            )}
          </div>
          <button type="button" disabled={!image || aiLoading} onClick={generateAIDescription} className="w-full py-5 rounded-[32px] bg-[#4a322e] text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-[#c99090] transition-all disabled:opacity-50 group">
            {aiLoading ? <Loader2 className="animate-spin" size={20} /> : <><Gem size={20} /> <span>MÁGICA LAPIDADO</span></>}
          </button>
        </div>

        <div className="space-y-6 bg-white p-10 rounded-[60px] border border-rose-50 shadow-sm text-brand-primary">
          <div>
            <div className="flex justify-between items-center mb-2 ml-2">
              <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em]">NOME DA PEÇA</label>
              <Edit2 size={12} className="text-[#c99090] opacity-50" />
            </div>
            <input type="text" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all uppercase" placeholder="EX: COLAR RIVIERA" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">VALOR DE CUSTO (R$)</label>
              <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] outline-none transition-all" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">MARGEM DE LUCRO (%)</label>
              <div className="relative">
                <input type="number" value={markup} onChange={(e) => setMarkup(e.target.value)} className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] outline-none transition-all" placeholder="100" />
                <Calculator className="absolute right-5 top-1/2 -translate-y-1/2 text-[#c99090] opacity-30" size={16} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2 ml-2">
                <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em]">VALOR DE VENDA (R$)</label>
                <Edit2 size={12} className="text-[#c99090] opacity-50" />
              </div>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-6 py-4 rounded-3xl bg-rose-50 border-2 border-[#c99090]/20 focus:border-[#c99090] outline-none transition-all font-bold" placeholder="0.00" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 ml-2">
                <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em]">QTD EM ESTOQUE</label>
                <Hash size={12} className="text-[#c99090] opacity-50" />
              </div>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] outline-none transition-all font-bold" placeholder="1" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 ml-2">
              <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em]">CATEGORIA DA PEÇA</label>
              <Edit2 size={12} className="text-[#c99090] opacity-50" />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] outline-none transition-all appearance-none uppercase">
              <option value=""></option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
            </select>
            <p className="text-[8px] font-bold text-[#c99090] mt-2 ml-4 uppercase tracking-widest">LAPIDADO SELECIONARÁ A CATEGORIA PARA VOCÊ ✨</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 ml-2">
              <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em]">DESCRIÇÃO DA PEÇA</label>
              <Edit2 size={12} className="text-[#c99090] opacity-50" />
            </div>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value.toUpperCase())} className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] outline-none transition-all resize-none uppercase" placeholder="O LAPIDADO ESCREVERÁ A DESCRIÇÃO PARA VOCÊ..." />
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 rounded-[32px] bg-[#4a322e] text-white font-black uppercase tracking-widest shadow-xl hover:bg-[#c99090] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} /> <span>SALVAR PEÇA NO CATÁLOGO</span></>}
          </button>
        </div>
      </form>
    </div>
  )
}
