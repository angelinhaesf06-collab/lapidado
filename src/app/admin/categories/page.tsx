'use client'

import { useState, useEffect } from 'react'
import { Gem, Plus, Edit2, Trash2, Loader2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingIdName] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
    setLoading(false)
  }

  async function handleAdd() {
    if (!newCategory) return
    setActionLoading('add')
    const slug = newCategory.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
    const { error } = await supabase.from('categories').insert([{ name: newCategory, slug }])
    if (!error) {
      setNewCategory('')
      loadCategories()
    }
    setActionLoading(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Isso pode afetar as joias cadastradas nela. 💎')) return
    setActionLoading(id)
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) loadCategories()
    setActionLoading(null)
  }

  async function handleUpdate(id: string) {
    if (!editingName) return
    setActionLoading(id)
    const slug = editingName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
    const { error } = await supabase.from('categories').update({ name: editingName, slug }).eq('id', id)
    if (!error) {
      setEditingId(null)
      loadCategories()
    }
    setActionLoading(null)
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="text-center mb-12">
        <h1 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.4em] mb-4 text-brand-secondary">Catálogo Lapidado</h1>
        <h2 className="text-3xl font-bold text-[#4a322e] text-brand-primary">Gestão de Categorias</h2>
        <p className="text-[#7a5c58] text-sm mt-2 font-medium italic">"Organize seu acervo para que cada joia encontre seu lugar de destaque." ✨</p>
      </div>

      {/* Adicionar Nova */}
      <div className="bg-white p-8 rounded-[40px] border border-rose-50 shadow-sm mb-10 flex gap-4 items-center">
        <input 
          type="text" 
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Ex: Tornozeleira"
          className="flex-1 px-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-[#4a322e]"
        />
        <button 
          onClick={handleAdd}
          disabled={actionLoading === 'add' || !newCategory}
          className="bg-[#4a322e] text-white p-4 rounded-full hover:bg-[#c99090] transition-all shadow-lg disabled:opacity-50"
        >
          {actionLoading === 'add' ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* Lista de Categorias */}
      <div className="bg-white rounded-[60px] border border-rose-50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#c99090]" size={40} /></div>
        ) : (
          <div className="divide-y divide-rose-50">
            {categories.map((cat) => (
              <div key={cat.id} className="p-6 flex items-center justify-between hover:bg-rose-50/30 transition-all">
                {editingId === cat.id ? (
                  <div className="flex-1 flex gap-3 mr-4">
                    <input 
                      type="text" 
                      value={editingName}
                      onChange={(e) => setEditingIdName(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border-2 border-[#c99090] outline-none"
                      autoFocus
                    />
                    <button onClick={() => handleUpdate(cat.id)} className="text-green-600 hover:scale-110 transition-all"><Check size={20} /></button>
                    <button onClick={() => setEditingId(null)} className="text-rose-400 hover:scale-110 transition-all"><X size={20} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#c99090]">
                      <Gem size={18} />
                    </div>
                    <span className="font-semibold text-[#4a322e]">{cat.name}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {editingId !== cat.id && (
                    <>
                      <button 
                        onClick={() => { setEditingId(cat.id); setEditingIdName(cat.name); }}
                        className="p-3 text-[#7a5c58] hover:text-[#c99090] hover:bg-white rounded-full transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        disabled={actionLoading === cat.id}
                        className="p-3 text-[#7a5c58] hover:text-rose-600 hover:bg-white rounded-full transition-all"
                      >
                        {actionLoading === cat.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 text-center">
        <a href="/admin" className="text-[#c99090] text-xs font-bold hover:underline italic">Voltar para o Espaço da Empresária</a>
      </div>
    </div>
  )
}
