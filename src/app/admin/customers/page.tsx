'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, User, Search, MapPin, CreditCard, Loader2, Trash2, History, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, FileText, Edit2, Save, X, Calendar, Phone } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Installment {
  id: string
  installment_number: number
  value: number
  status: 'pago' | 'pendente'
  due_date: string
}

interface Sale {
  id: string
  created_at: string
  total_value: number
  payment_method: string
  installments: number
  status: 'pago' | 'pendente'
  products: {
    name: string
    image_url: string
  }
  installment_list: Installment[]
}

interface Customer {
  id: string
  name: string
  cpf: string
  address: string
  phone: string
  total_purchases?: number
  sales?: Sale[]
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
  const [editingInstallment, setEditingInstallment] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [editDate, setEditDate] = useState<string>('')
  const [newCustomer, setNewCustomer] = useState({ name: '', cpf: '', address: '', phone: '' })
  const supabase = createClient()

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          sales (
            id,
            created_at,
            total_value,
            payment_method,
            installments,
            status,
            products (
              name,
              image_url
            ),
            installments (
              id,
              installment_number,
              value,
              status,
              due_date
            )
          )
        `)
        .eq('user_id', user.id)
        .order('name')

      if (customersError) throw customersError

      const formattedCustomers = customersData.map((c: any) => ({
        ...c,
        total_purchases: c.sales?.reduce((acc: number, s: any) => acc + (Number(s.total_value) || 0), 0) || 0,
        sales: (c.sales || []).map((s: any) => ({
          ...s,
          installment_list: (s.installments || []).sort((a: any, b: any) => a.installment_number - b.installment_number)
        }))
      }))

      setCustomers(formattedCustomers)
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleInstallmentStatus(instId: string, currentStatus: string) {
    const newStatus = currentStatus === 'pago' ? 'pendente' : 'pago'
    try {
      const { error } = await supabase.from('installments').update({ 
        status: newStatus,
        paid_at: newStatus === 'pago' ? new Date().toISOString() : null
      }).eq('id', instId)
      
      if (error) throw error
      toast.success(`Parcela marcada como ${newStatus.toUpperCase()}`)
      loadCustomers()
    } catch (error: any) {
      toast.error('Erro ao atualizar parcela: ' + error.message)
    }
  }

  async function handleSaveInstallment(instId: string) {
    const val = parseFloat(editValue.replace(',', '.'))
    if (isNaN(val)) return toast.error('Valor inválido')

    try {
      const { error } = await supabase.from('installments').update({ 
        value: val,
        due_date: editDate 
      }).eq('id', instId)
      
      if (error) throw error
      toast.success('Parcela atualizada!')
      setEditingInstallment(null)
      loadCustomers()
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message)
    }
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('customers').insert([{ ...newCustomer, user_id: user.id }])
      if (error) throw error
      toast.success('Cliente cadastrado!')
      setIsAdding(false)
      setNewCustomer({ name: '', cpf: '', address: '', phone: '' })
      loadCustomers()
    } catch (error: any) {
      toast.error('Erro ao cadastrar: ' + error.message)
    }
  }

  async function handleDeleteCustomer(id: string) {
    if (!confirm('Deseja realmente excluir este cliente e todo seu histórico?')) return
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
      toast.success('Cliente removido.')
      loadCustomers()
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.cpf?.includes(search)
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-brand-primary tracking-tight uppercase">Gestão de Clientes</h1>
          <p className="text-brand-secondary/60 font-medium tracking-wide mt-1">Controle Financeiro e Fluxo de Recebimentos 💎</p>
        </div>
        
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center justify-center gap-2 bg-brand-primary text-white px-8 py-4 rounded-[20px] font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all">
          {isAdding ? 'Fechar Form' : <><Plus size={16} /> Novo Cliente</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border border-brand-secondary/10 rounded-[32px] p-8 mb-12 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-brand-secondary/60 ml-2 tracking-widest">Nome</label><input required className="w-full bg-brand-secondary/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all font-bold text-brand-primary" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-brand-secondary/60 ml-2 tracking-widest">WhatsApp</label><input required className="w-full bg-brand-secondary/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all font-bold text-brand-primary" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="(00) 00000-0000" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-brand-secondary/60 ml-2 tracking-widest">CPF</label><input className="w-full bg-brand-secondary/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all font-bold text-brand-primary" value={newCustomer.cpf} onChange={e => setNewCustomer({...newCustomer, cpf: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-brand-secondary/60 ml-2 tracking-widest">Endereço</label><input className="w-full bg-brand-secondary/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all font-bold text-brand-primary" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} /></div>
            <div className="md:col-span-4 flex justify-end"><button type="submit" className="bg-brand-primary text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-brand-primary/20">Salvar Cliente</button></div>
          </form>
        </div>
      )}

      <div className="relative mb-8 group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-secondary/40 group-focus-within:text-brand-primary transition-colors" size={20} />
        <input placeholder="BUSCAR POR NOME OU CPF..." className="w-full bg-white border border-brand-secondary/10 rounded-[24px] pl-16 pr-6 py-5 focus:ring-2 focus:ring-brand-primary outline-none transition-all font-black uppercase text-[11px] tracking-widest text-brand-primary placeholder:text-brand-secondary/30" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-brand-primary" size={40} /><p className="text-[10px] font-black uppercase text-brand-secondary/40 tracking-[0.3em]">Acessando Arquivos Financeiros...</p></div>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-white border border-brand-secondary/5 rounded-[32px] overflow-hidden shadow-sm">
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-brand-secondary/5 flex items-center justify-center text-brand-primary"><User size={32} /></div>
                    <div>
                      <h3 className="text-xl font-black text-brand-primary uppercase tracking-tight">{customer.name}</h3>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <p className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest">CPF: {customer.cpf || '-'}</p>
                        <p className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest flex items-center gap-1"><Phone size={12} /> {customer.phone || 'Sem WhatsApp'}</p>
                        <p className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest flex items-center gap-1"><MapPin size={12} /> {customer.address || 'Sem endereço'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right"><p className="text-[8px] font-black text-brand-secondary/40 uppercase mb-1">Total Comprado</p><p className="text-xl font-black text-brand-primary">R$ {(customer.total_purchases || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                    <button onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)} className={`p-4 rounded-2xl transition-all ${expandedCustomer === customer.id ? 'bg-brand-primary text-white' : 'bg-brand-secondary/5 text-brand-primary'}`}>{expandedCustomer === customer.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
                    <button onClick={() => handleDeleteCustomer(customer.id)} className="p-4 text-rose-200 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
                  </div>
                </div>
              </div>

              {expandedCustomer === customer.id && (
                <div className="bg-rose-50/20 border-t border-brand-secondary/5 p-8 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-6"><History size={16} className="text-brand-primary" /><h4 className="text-[10px] font-black uppercase text-brand-primary tracking-[0.3em]">Gestão de Parcelas e Vencimentos</h4></div>
                  <div className="space-y-6">
                    {customer.sales?.map((sale) => (
                      <div key={sale.id} className="bg-white p-6 rounded-[28px] border border-brand-secondary/10 shadow-sm">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-6 pb-4 border-b border-brand-secondary/5 gap-4">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-brand-secondary/5">
                                {sale.products?.image_url && <Image src={sale.products.image_url} alt="" fill className="object-cover" />}
                              </div>
                              <div>
                                <h5 className="text-[10px] font-black text-brand-primary uppercase">{sale.products?.name}</h5>
                                <p className="text-[8px] font-bold text-brand-secondary/40 uppercase">{new Date(sale.created_at).toLocaleDateString('pt-BR')} • {sale.payment_method}</p>
                              </div>
                           </div>
                           <p className="text-sm font-black text-brand-primary uppercase tracking-tighter">Total: R$ {sale.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {sale.installment_list.map((inst) => (
                            <div key={inst.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${inst.status === 'pago' ? 'bg-green-50 border-green-100 opacity-80' : 'bg-white border-brand-secondary/5'}`}>
                               <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[8px] font-black text-brand-secondary/40 uppercase tracking-widest">Parcela {inst.installment_number}</p>
                                    {inst.status === 'pago' && <CheckCircle2 size={10} className="text-green-500" />}
                                  </div>
                                  
                                  {editingInstallment === inst.id ? (
                                    <div className="flex flex-col gap-2">
                                       <div className="flex items-center gap-2">
                                          <input autoFocus className="w-24 bg-white border border-brand-primary/20 rounded-lg px-2 py-1 text-xs font-black text-brand-primary" value={editValue} onChange={e => setEditValue(e.target.value)} />
                                          <input type="date" className="bg-white border border-brand-primary/20 rounded-lg px-2 py-1 text-[10px] font-black text-brand-primary" value={editDate?.split('T')[0]} onChange={e => setEditDate(e.target.value)} />
                                       </div>
                                       <div className="flex gap-2">
                                          <button onClick={() => handleSaveInstallment(inst.id)} className="bg-brand-primary text-white p-1.5 rounded-lg shadow-md transition-all active:scale-95"><Save size={14} /></button>
                                          <button onClick={() => setEditingInstallment(null)} className="bg-white border border-brand-secondary/10 text-brand-secondary p-1.5 rounded-lg"><X size={14} /></button>
                                       </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col group/val">
                                       <div className="flex items-center gap-2">
                                          <p className={`text-xs font-black ${inst.status === 'pago' ? 'text-green-700' : 'text-brand-primary'}`}>R$ {inst.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                          <button onClick={() => { 
                                            setEditingInstallment(inst.id); 
                                            setEditValue(inst.value.toString().replace('.', ','));
                                            setEditDate(inst.due_date || new Date().toISOString());
                                          }} className="opacity-0 group-hover/val:opacity-100 text-brand-secondary/40 hover:text-brand-primary transition-all"><Edit2 size={10} /></button>
                                       </div>
                                       <div className="flex items-center gap-1 mt-0.5">
                                          <Calendar size={8} className="text-brand-secondary/40" />
                                          <p className="text-[7px] font-black text-brand-secondary/60 uppercase">
                                            {inst.due_date ? new Date(inst.due_date).toLocaleDateString('pt-BR') : 'Data pendente'}
                                          </p>
                                       </div>
                                    </div>
                                  )}
                               </div>
                               <button 
                                 onClick={() => handleToggleInstallmentStatus(inst.id, inst.status)} 
                                 className={`px-5 py-2.5 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all ${
                                   inst.status === 'pago' 
                                   ? 'bg-white text-rose-500 border border-rose-100 hover:bg-rose-50' 
                                   : 'bg-green-500 text-white shadow-lg shadow-green-500/10 hover:scale-105 active:scale-95'
                                 }`}
                               >
                                 {inst.status === 'pago' ? 'Estornar' : 'Baixa'}
                               </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
