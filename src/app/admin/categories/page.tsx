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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer LAPIDADO_ADMIN_2026` },
        body: JSON.stringify({ table: 'categories', data: { name: newCategory.toUpperCase() } })
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      setNewCategory('')
      await loadCategories()
    } catch (err: unknown) {
      alert('ERRO: ' + (err as Error).message.toUpperCase())
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingName) return
    try {
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer LAPIDADO_ADMIN_2026` },
        body: JSON.stringify({ table: 'categories', id, data: { name: editingName.toUpperCase() } })
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      setEditingId(null)
      await loadCategories()
    } catch (err: unknown) {
      alert('ERRO: ' + (err as Error).message.toUpperCase())
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('EXCLUIR? 💎')) return
    try {
      await supabase.from('categories').delete().eq('id', id)
      await loadCategories()
    } catch (err: unknown) {
      alert('ERRO: ' + (err as Error).message.toUpperCase())
    }
  }

  return (
    <div className="h-[calc(100vh-180px)] md:h-auto flex flex-col max-w-4xl mx-auto py-2 px-4 overflow-hidden">
      
      {/* HEADER ULTRA COMPACTO */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/admin" className="p-2 text-brand-secondary/60 hover:text-brand-primary transition-all">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Gestão de Categorias</h1>
        <div className="w-8" />
      </div>

      {/* ADICIONAR NOVA - FORMULÁRIO EM LINHA ÚNICA */}
      <div className="bg-white/60 p-4 rounded-[24px] border border-rose-50 shadow-sm mb-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input 
            type="text" 
            placeholder="NOME DA CATEGORIA..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-50/30 border border-transparent focus:border-brand-secondary outline-none font-bold text-[9px] text-brand-primary uppercase shadow-inner"
          />
          <button 
            type="submit" 
            disabled={adding || !newCategory}
            className="px-4 bg-brand-primary text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          </button>
        </form>
      </div>

      {/* LISTAGEM EM GRADE - TUDO VISÍVEL */}
      <div className="flex-1 bg-white/40 p-4 rounded-[24px] border border-rose-50 shadow-sm overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-2 gap-2">
          {loading ? (
            <div className="col-span-2 flex justify-center py-10 text-brand-secondary/40"><Loader2 className="animate-spin" size={20} /></div>
          ) : categories.length > 0 ? (
            categories.map((cat) => (
              <div key={cat.id} className="bg-white/80 p-3 rounded-xl border border-rose-50 shadow-xs flex flex-col justify-between h-20 relative group">
                {editingId === cat.id ? (
                  <div className="flex flex-col gap-1 h-full">
                    <input 
                      type="text" 
                      value={editingName} 
                      onChange={(e) => setEditingName(e.target.value.toUpperCase())}
                      className="w-full bg-rose-50/50 px-2 py-1 rounded text-[8px] font-bold outline-none border border-brand-secondary"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleUpdate(cat.id)} className="text-green-500 p-1"><Check size={12} /></button>
                      <button onClick={() => setEditingId(null)} className="text-rose-500 p-1"><X size={12} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-[8px] font-black text-brand-primary uppercase leading-tight pr-4">{cat.name}</span>
                    <div className="flex justify-end gap-1 mt-auto">
                      <button onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }} className="p-1.5 text-brand-secondary/30 hover:text-brand-primary transition-all"><Pencil size={10} /></button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-rose-200 hover:text-rose-500 transition-all"><Trash2 size={10} /></button>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="col-span-2 text-center text-[8px] text-brand-primary/30 uppercase font-black py-10 tracking-widest">Vazio 💎</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Ícones extras necessários
function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  )
}
