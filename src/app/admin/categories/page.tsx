'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Loader2, ArrowLeft, Pencil, Check, X, Gem } from 'lucide-react'
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase.from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
      
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')

      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          table: 'categories', 
          data: { 
            name: newCategory.toUpperCase(),
            user_id: user.id
          } 
        })
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text()
        console.error('Erro detalhado:', errorText)
        throw new Error('O servidor retornou um erro inesperado (HTML). Verifique as variáveis de ambiente no painel da Vercel.')
      }

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'categories', id, data: { name: editingName.toUpperCase() } })
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text()
        console.error('Erro detalhado:', errorText)
        throw new Error('O servidor retornou um erro inesperado (HTML). Verifique as variáveis de ambiente no painel da Vercel.')
      }

      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      setEditingId(null)
      await loadCategories()
    } catch (err: unknown) {
      alert('ERRO AO ATUALIZAR: ' + (err as Error).message.toUpperCase())
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
    <div className="flex flex-col h-full max-w-4xl mx-auto py-1 px-2 overflow-hidden">
      
      {/* FORMULÁRIO E TÍTULO EM LINHA ÚNICA (ULTRA COMPACTO) */}
      <div className="flex items-center gap-2 mb-3 bg-white/80 p-2 rounded-2xl border border-rose-50 shadow-sm">
        <Link href="/admin" className="p-1 text-brand-secondary/60 hover:text-brand-primary"><ArrowLeft size={14} /></Link>
        <form onSubmit={handleAdd} className="flex-1 flex gap-1">
          <input 
            type="text" 
            placeholder="NOVA COLEÇÃO..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value.toUpperCase())}
            className="flex-1 px-3 py-1.5 rounded-xl bg-rose-50/30 border border-transparent focus:border-brand-secondary outline-none font-bold text-[8px] text-brand-primary uppercase shadow-inner"
          />
          <button 
            type="submit" 
            disabled={adding || !newCategory}
            className="px-3 py-1.5 bg-brand-primary text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm disabled:opacity-50"
          >
            {adding ? <Loader2 size={10} className="animate-spin" /> : <Gem size={10} />}
          </button>
        </form>
      </div>

      {/* LISTAGEM EM GRADE DENSA (2 Colunas no Mobile) */}
      <div className="flex-1 bg-white/40 p-3 rounded-2xl border border-rose-50 shadow-sm overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-2 gap-2">
          {loading ? (
            <div className="col-span-full flex justify-center py-8 text-brand-secondary/40"><Loader2 className="animate-spin" size={24} /></div>
          ) : categories.length > 0 ? (
            categories.map((cat) => (
              <div key={cat.id} className="bg-white/90 p-4 rounded-xl border border-rose-50 flex flex-col justify-between min-h-[90px] relative shadow-sm">
                {editingId === cat.id ? (
                  <div className="flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={editingName} 
                      onChange={(e) => setEditingName(e.target.value.toUpperCase())}
                      className="w-full bg-rose-50/50 px-2 py-1.5 rounded-lg text-[10px] font-bold outline-none border-2 border-brand-secondary"
                      autoFocus
                    />
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleUpdate(cat.id)} className="p-1 text-green-500 hover:scale-110 transition-transform"><Check size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-rose-500 hover:scale-110 transition-transform"><X size={18} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-[10px] font-black text-brand-primary uppercase leading-tight line-clamp-2">{cat.name}</span>
                    <div className="flex justify-end gap-2 mt-auto">
                      <button 
                        onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }} 
                        className="p-2 bg-brand-secondary/5 text-brand-secondary hover:text-brand-primary rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)} 
                        className="p-2 bg-rose-50 text-rose-300 hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-[10px] text-brand-primary/30 uppercase font-black py-10">Vazio 💎</p>
          )}
        </div>
      </div>
    </div>
  )
}
