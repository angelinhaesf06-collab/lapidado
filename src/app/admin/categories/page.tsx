'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, LayoutGrid, Loader2, ArrowLeft, Pencil, Check, X } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  const loadCategories = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data as Category[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory) return
    setAdding(true)
    try {
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer LAPIDADO_ADMIN_2026`
        },
        body: JSON.stringify({ 
          table: 'categories', 
          data: { name: newCategory.toUpperCase() } 
        })
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      
      setNewCategory('')
      await loadCategories()
      alert('CATEGORIA ADICIONADA! 💎')
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert('ERRO: ' + error.message.toUpperCase())
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingName) return
    try {
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer LAPIDADO_ADMIN_2026`
        },
        body: JSON.stringify({ 
          table: 'categories', 
          id,
          data: { name: editingName.toUpperCase() } 
        })
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      
      setEditingId(null)
      await loadCategories()
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert('ERRO AO ATUALIZAR: ' + error.message.toUpperCase())
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('DESEJA REALMENTE EXCLUIR ESTA CATEGORIA? ISSO NÃO APAGARÁ OS PRODUTOS DELA. 💎')) return
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      await loadCategories()
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert('ERRO: ' + error.message.toUpperCase())
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-12">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black text-[#c99090] uppercase tracking-widest mb-4 hover:ml-2 transition-all">
          <ArrowLeft size={14} /> Voltar ao Painel
        </Link>
        <h1 className="text-3xl font-bold text-[#4a322e] uppercase tracking-tight flex items-center gap-3">
          <LayoutGrid className="text-[#c99090]" /> Categorias do Catálogo
        </h1>
      </div>

      {/* Adicionar Nova */}
      <div className="bg-white p-10 rounded-[60px] border border-rose-50 shadow-sm mb-12">
        <h3 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-8">Nova Categoria</h3>
        <form onSubmit={handleAdd} className="flex gap-4">
          <input 
            type="text" 
            placeholder="NOME DA CATEGORIA (EX: COLARES BANHADOS)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value.toUpperCase())}
            className="flex-1 px-8 py-5 rounded-3xl bg-rose-50/20 border-2 border-transparent focus:border-[#c99090] outline-none font-bold text-[#4a322e] uppercase"
          />
          <button 
            type="submit" 
            disabled={adding || !newCategory}
            className="px-10 bg-[#4a322e] text-white rounded-3xl font-black uppercase tracking-widest shadow-lg hover:bg-[#c99090] transition-all disabled:opacity-50"
          >
            {adding ? <Loader2 size={24} className="animate-spin" /> : 'Adicionar'}
          </button>
        </form>
      </div>

      {/* Listagem */}
      <div className="bg-white p-10 rounded-[60px] border border-rose-50 shadow-sm">
        <h3 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-8">Categorias Atuais</h3>
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#c99090]" size={24} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-6 rounded-3xl bg-rose-50/30 border border-rose-100/50 group hover:bg-rose-50 transition-all">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input 
                      type="text" 
                      value={editingName} 
                      onChange={(e) => setEditingName(e.target.value.toUpperCase())}
                      className="flex-1 bg-white px-4 py-2 rounded-xl border border-[#c99090] outline-none font-bold text-[#4a322e] text-[11px]"
                    />
                    <button onClick={() => handleUpdate(cat.id)} className="text-green-500 p-2"><Check size={16} /></button>
                    <button onClick={() => setEditingId(null)} className="text-rose-500 p-2"><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-[#4a322e] uppercase text-[11px] tracking-wider">{cat.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                        className="p-3 text-[#c99090] hover:text-[#4a322e] hover:bg-white rounded-full transition-all"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="p-3 text-rose-300 hover:text-rose-500 hover:bg-white rounded-full transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
