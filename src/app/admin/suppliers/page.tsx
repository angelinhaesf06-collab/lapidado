'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, Phone, ExternalLink, Trash2, Search, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Supplier {
  id: string
  created_at: string
  name: string
  category: string
  phone?: string
  link?: string
  notes?: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Estado para novo fornecedor
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [phone, setPhone] = useState('')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')

  const supabase = createClient()

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    
    if (data) setSuppliers(data as Supplier[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  async function handleAddSupplier() {
    if (!name || !category) return

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { error } = await supabase.from('suppliers').insert({
        user_id: user.id,
        name: name.toUpperCase(),
        category: category.toUpperCase(),
        phone,
        link,
        notes
      })

      if (error) throw error

      setShowAddModal(false)
      setName('')
      setCategory('')
      setPhone('')
      setLink('')
      setNotes('')
      loadSuppliers()
      alert('FORNECEDOR CADASTRADO COM SUCESSO! 💎')
    } catch {
      alert('ERRO AO CADASTRAR FORNECEDOR.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteSupplier(id: string) {
    if (!confirm('DESEJA REALMENTE EXCLUIR ESTE FORNECEDOR?')) return

    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
      setSuppliers(suppliers.filter(s => s.id !== id))
    } catch {
      alert('ERRO AO EXCLUIR.')
    }
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight uppercase text-brand-primary">Compras & Fornecedores</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Sua rede estratégica de parcerias 🤝</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40" size={16} />
          <input 
            type="text" 
            placeholder="BUSCAR FORNECEDOR OU CATEGORIA..." 
            className="w-full pl-12 pr-4 py-4 rounded-[25px] bg-white border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none focus:border-brand-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-primary text-white px-8 py-4 rounded-[25px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all"
        >
          <Plus size={18} /> Novo Fornecedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-brand-secondary" /></div>
        ) : filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((s) => (
            <div key={s.id} className="bg-white p-6 rounded-[40px] border border-brand-secondary/5 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-brand-primary uppercase">{s.name}</h3>
                  <p className="text-[8px] font-black text-brand-secondary uppercase tracking-widest">{s.category}</p>
                </div>
              </div>

              {s.notes && (
                <p className="text-[9px] text-brand-secondary/70 mb-6 italic leading-relaxed">"{s.notes}"</p>
              )}

              <div className="flex items-center gap-2 mt-auto">
                {s.phone && (
                  <a 
                    href={`https://wa.me/${s.phone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    className="flex-1 bg-rose-50 text-brand-primary py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-all text-[9px] font-bold uppercase"
                  >
                    <Phone size={14} /> WhatsApp
                  </a>
                )}
                {s.link && (
                  <a 
                    href={s.link} 
                    target="_blank" 
                    className="flex-1 bg-brand-primary text-white py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all text-[9px] font-bold uppercase"
                  >
                    <ExternalLink size={14} /> Site
                  </a>
                )}
              </div>

              <button 
                onClick={() => handleDeleteSupplier(s.id)}
                className="absolute top-4 right-4 p-2 text-rose-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center opacity-40">
            <Store className="mx-auto mb-4" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Nenhum fornecedor cadastrado. 💎</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-brand-primary uppercase mb-6 text-center">Cadastrar Fornecedor</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Nome do Fornecedor</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="EX: ATACADO DAS JOIAS"
                />
              </div>

              <div>
                <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Categoria (O que ele vende?)</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="EX: SEMIJOIAS BANHADAS, EMBALAGENS"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">WhatsApp</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Link do Site</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Notas Estratégicas</label>
                <textarea 
                  className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none h-20 resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="EX: MELHOR BANHO DE OURO, ENTREGA RÁPIDA"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-4 text-[9px] font-black uppercase text-brand-secondary tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddSupplier}
                disabled={isSaving}
                className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : 'Salvar Fornecedor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
