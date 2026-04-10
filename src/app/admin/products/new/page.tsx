'use client'

import { useState, useEffect } from 'react'
import { Gem, Loader2, Camera, Plus, Check, Edit2, Calculator, Hash, FolderPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewProductPage() {
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState<string>('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [catLoading, setCatLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleCreateCategory = async () => {
    if (!newCategoryName) return
    setCatLoading(true)
    try {
      const slug = newCategoryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-')
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'categories',
          data: { name: newCategoryName.toUpperCase(), slug }
        })
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      await loadCategories()
      setCategory(result.data.id)
      setShowNewCategory(false)
      setNewCategoryName('')
      alert('CATEGORIA CRIADA! 💎')
    } catch (err: any) {
      alert('ERRO AO CRIAR CATEGORIA: ' + err.message.toUpperCase())
    } finally {
      setCatLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (event) => setImage(event.target?.result as string)
    reader.readAsDataURL(file)
  }

  // MÁGICA NEXUS: COMPRESSÃO E REDUÇÃO AUTOMÁTICA
  const compressImage = async (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64Str
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800 // IA não precisa de mais que isso
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
        // Reduzindo para 60% de qualidade JPEG (~100kb a 300kb)
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
    })
  }

  const generateAIDescription = async () => {
    if (!image) return
    setAiLoading(true)
    try {
      const compressed = await compressImage(image)
      
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
    } catch (err: any) {
      alert(`AVISO: A MÁGICA LAPIDADO ESTÁ SOBRECARREGADA. ✨\n\nCONTINUE O CADASTRO MANUALMENTE PARA NÃO PERDER SEU TEMPO. 💎`)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile || !name || !price || !category) {
      alert('POR FAVOR, PREENCHA TUDO E SUBA A FOTO. 💎')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('bucket', 'products')

      const uploadResponse = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const uploadResult = await uploadResponse.json()
      if (uploadResult.error) throw new Error(uploadResult.error)
      
      const productData = {
        name: name.toUpperCase(),
        price: parseFloat(price),
        category_id: category,
        description: description.toUpperCase(),
        image_url: uploadResult.url
      }

      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'products', data: productData })
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      
      alert('JOIA SALVA COM SUCESSO! 💎✨')
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      alert('ERRO AO SALVAR: ' + err.message.toUpperCase())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="text-center mb-12">
        <h1 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.4em] mb-4">CATÁLOGO LAPIDADO</h1>
        <h2 className="text-3xl font-bold text-[#4a322e] uppercase tracking-tight">NOVA PEÇA</h2>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className={`relative aspect-square rounded-[60px] overflow-hidden border-2 border-dashed transition-all flex items-center justify-center bg-white ${image ? 'border-transparent shadow-2xl shadow-rose-100' : 'border-rose-100'}`}>
            {image ? <img src={image} alt="PREVIEW" className="w-full h-full object-cover" /> : (
              <label className="cursor-pointer flex flex-col items-center gap-4">
                <Camera size={28} className="text-[#c99090]" />
                <p className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em]">FOTO DA JOIA</p>
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
            )}
          </div>
          <button type="button" disabled={!image || aiLoading} onClick={generateAIDescription} className="w-full py-5 rounded-[32px] bg-[#4a322e] text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-[#c99090] transition-all disabled:opacity-50">
            {aiLoading ? <Loader2 className="animate-spin" size={20} /> : <><Gem size={20} /> <span>MÁGICA LAPIDADO</span></>}
          </button>
        </div>

        <div className="space-y-6 bg-white p-10 rounded-[60px] border border-rose-50 shadow-sm">
          <div>
            <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 block">NOME</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 outline-none uppercase" />
          </div>
          <div>
            <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 block">PREÇO (R$)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-6 py-4 rounded-3xl bg-rose-50 font-bold outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 block">CATEGORIA</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 outline-none uppercase">
              <option value=""></option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 block">DESCRIÇÃO</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value.toUpperCase())} className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 outline-none resize-none uppercase" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-5 rounded-[32px] bg-[#4a322e] text-white font-black uppercase tracking-widest shadow-xl hover:bg-[#c99090] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} /> <span>SALVAR PEÇA</span></>}
          </button>
        </div>
      </form>
    </div>
  )
}
