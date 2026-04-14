'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Loader2, ArrowLeft, Pencil, Check, X, Gem, LayoutGrid } from 'lucide-react'
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
    if (!confirm('DESEJA REALMENTE EXCLUIR ESTA CATEGORIA? 💎')) return
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
    <div className="max-w-4xl mx-auto py-6 px-5 pb-20">
      <div className="text-center mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-[8px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-4 opacity-60 hover:opacity-100 transition-all">
          <ArrowLeft size={12} /> Voltar ao Painel
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-brand-primary uppercase tracking-tight">Categorias</h1>
      </div>

      {/* ADICIONAR NOVA - CENTRALIZADO E DELICADO */}
      <div className="bg-white/60 p-6 rounded-[40px] border border-rose-50 shadow-sm mb-8 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-6"><LayoutGrid className="text-brand-secondary" size={16} /><h3 className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Nova Categoria</h3></div>
        
        <form onSubmit={handleAdd} className="w-full max-w-[320px] space-y-4">
          <input 
            type="text" 
            placeholder="NOME DA CATEGORIA..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value.toUpperCase())}
            className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-transparent focus:border-brand-secondary outline-none font-bold text-[10px] text-brand-primary uppercase text-center placeholder:text-brand-primary/30 shadow-inner"
          />
          <button 
            type="submit" 
            disabled={adding || !newCategory}
            className="w-full py-4 bg-brand-primary text-white rounded-[24px] text-[9px] font-black uppercase tracking-widest shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <><Gem size={16} /> <span>Salvar Nova Categoria</span></>}
          </button>
        </form>
      </div>

      {/* LISTAGEM FINA */}
      <div className="bg-white/40 p-6 rounded-[40px] border border-rose-50 shadow-sm">
        <h3 className="text-[9px] font-bold text-brand-secondary uppercase tracking-[0.2em] mb-6 text-center">Coleções Cadastradas</h3>
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-brand-secondary" size={24} /></div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/80 border border-rose-50 shadow-sm group">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input 
                      type="text" 
                      value={editingName} 
                      onChange={(e) => setEditingName(e.target.value.toUpperCase())}
                      className="flex-1 bg-rose-50/30 px-4 py-2 rounded-xl outline-none font-bold text-brand-primary text-[10px]"
                    />
                    <button onClick={() => handleUpdate(cat.id)} className="text-green-500 p-1"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="text-rose-500 p-1"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-brand-primary uppercase text-[9px] tracking-wider pl-2">{cat.name}</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                        className="p-2 text-brand-secondary/40 hover:text-brand-primary transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-rose-200 hover:text-rose-500 transition-all"
                      >
                        <Trash2 size={14} />
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
