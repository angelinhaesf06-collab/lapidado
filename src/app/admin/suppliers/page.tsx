'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, Phone, ExternalLink, Trash2, Search, Store, Receipt, ShoppingBag, X, Check, Camera, Sparkles, Pencil, Calendar, Coins, Hammer, Layers, Droplet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Supplier {
  id: string
  created_at: string
  name: string
  category: 'BRUTO' | 'FOLHADO' | 'GALVANICA'
  phone?: string
  link?: string
  notes?: string
}

interface Product {
  id: string
  name: string
  stock_quantity: number
  price?: number
}

interface PurchaseItem {
  productId?: string
  name: string
  quantity: number
  unitCost: number
  grams?: number
  laborCost?: number
  microns?: number
  bathType?: 'OURO' | 'PRATA 30' | 'PRATA 50' | 'PRATA 70' | 'RODIO BRANCO' | 'RODIO NEGRO'
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([{ name: '', quantity: 1, unitCost: 0, bathType: 'OURO' }])
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [globalGoldPrice, setGlobalGoldPrice] = useState(0)
  
  const [isFinishingPurchase, setIsFinishingPurchase] = useState(false)
  const [isReadingPhoto, setIsReadingPhoto] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'TODOS' | 'BRUTO' | 'FOLHADO' | 'GALVANICA'>('TODOS')

  const [name, setName] = useState('')
  const [category, setCategory] = useState<'BRUTO' | 'FOLHADO' | 'GALVANICA'>('BRUTO')
  const [phone, setPhone] = useState('')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')

  const supabase = createClient()

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: supData } = await supabase.from('suppliers').select('*').eq('user_id', user.id).order('name')
    if (supData) setSuppliers(supData as Supplier[])
    const { data: prodData } = await supabase.from('products').select('id, name, stock_quantity, price').eq('user_id', user.id).order('name')
    if (prodData) setProducts(prodData as Product[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const calculateItemCost = (item: PurchaseItem) => {
    if (item.bathType === 'OURO') {
      return (item.grams || 0) * (globalGoldPrice || 0) + (item.microns || 0) * (item.laborCost || 0);
    }
    return (item.grams || 0) * (item.laborCost || 0);
  }

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s); setName(s.name); setCategory(s.category); setPhone(s.phone || ''); setLink(s.link || ''); setNotes(s.notes || ''); setShowAddModal(true)
  }

  const closeFormModal = () => {
    setShowAddModal(false); setEditingSupplier(null); setName(''); setCategory('BRUTO'); setPhone(''); setLink(''); setNotes('')
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setIsReadingPhoto(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      try {
        const res = await fetch('/api/ai/romaneio', { method: 'POST', body: JSON.stringify({ image: base64 }) })
        const data = await res.json()
        if (Array.isArray(data)) {
          const mapped = data.map(item => ({ ...item, bathType: 'OURO', productId: products.find(p => p.name.toUpperCase().includes(item.name.toUpperCase()))?.id }))
          setPurchaseItems(mapped); alert('PROCESSADO! 💎')
        }
      } catch { alert('ERRO AO LER ARQUIVO.') } finally { setIsReadingPhoto(false) }
    }
    reader.readAsDataURL(file)
  }

  const generatePDF = (supplier: Supplier, items: PurchaseItem[], total: number, dateStr: string) => {
    const doc = new jsPDF()
    const date = dateStr.split('-').reverse().join('/')
    doc.setFontSize(20); doc.setTextColor(74, 50, 46); doc.text('LAPIDADO', 105, 20, { align: 'center' })
    doc.setFontSize(10); doc.setTextColor(201, 144, 144); doc.text(`ROMANEIO - ${supplier.category}`, 105, 27, { align: 'center' })
    doc.line(20, 35, 190, 35)
    doc.setFontSize(10); doc.setTextColor(74, 50, 46)
    doc.text(`FORNECEDOR: ${supplier.name}`, 20, 42); doc.text(`DATA: ${date}`, 190, 42, { align: 'right' })
    
    const head = supplier.category === 'GALVANICA' 
      ? [['ITEM', 'QNT', 'BANHO', 'DETALHE', 'CUSTO UN.', 'TOTAL']]
      : [['ITEM', 'QNT', 'CUSTO UN.', 'TOTAL']]

    const body = items.map(i => supplier.category === 'GALVANICA'
      ? [
          i.name.toUpperCase(), 
          i.quantity, 
          i.bathType || '-', 
          i.bathType === 'OURO' ? `${i.microns || 0}mil / ${i.grams || 0}g` : `${i.grams || 0}g`, 
          `R$ ${i.unitCost.toLocaleString('pt-BR')}`, 
          `R$ ${(i.quantity * i.unitCost).toLocaleString('pt-BR')}`
        ]
      : [
          i.name.toUpperCase(), 
          i.quantity, 
          `R$ ${i.unitCost.toLocaleString('pt-BR')}`, 
          `R$ ${(i.quantity * i.unitCost).toLocaleString('pt-BR')}`
        ]
    )

    autoTable(doc, { startY: 50, head, body, theme: 'striped', headStyles: { fillColor: [74, 50, 46] } })
    doc.save(`romaneio-${supplier.name.toLowerCase()}.pdf`)
  }

  const generateStorePDF = () => {
    if (products.length === 0) return
    const doc = new jsPDF()
    const date = new Date().toLocaleDateString('pt-BR')
    doc.setFontSize(20); doc.setTextColor(74, 50, 46); doc.text('LAPIDADO', 105, 20, { align: 'center' })
    doc.setFontSize(10); doc.setTextColor(201, 144, 144); doc.text('ESTOQUE ATUAL', 105, 27, { align: 'center' })
    const tableData = products.map(p => [p.name.toUpperCase(), p.stock_quantity, `R$ ${(p.price || 0).toLocaleString('pt-BR')}`])
    autoTable(doc, { startY: 35, head: [['PRODUTO', 'QNT', 'PREÇO']], body: tableData, headStyles: { fillColor: [74, 50, 46] } })
    doc.save(`estoque-${date.replace(/\//g, '-')}.pdf`)
  }

  const handleFinishPurchase = async () => {
    if (!selectedSupplier) return
    setIsFinishingPurchase(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const total = purchaseItems.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0)
      const { data: purchase } = await supabase.from('purchases').insert({ user_id: user?.id, supplier_id: selectedSupplier.id, total_amount: total, created_at: new Date(purchaseDate).toISOString() }).select().single()
      if (purchase) {
        for (const item of purchaseItems) {
          await supabase.from('purchase_items').insert({ 
            purchase_id: purchase.id, product_id: item.productId || null, name: item.name.toUpperCase(), quantity: item.quantity, unit_cost: item.unitCost,
            notes: selectedSupplier.category === 'GALVANICA' ? `BANHO: ${item.bathType} | MIL: ${item.microns} | PESO: ${item.grams}` : ''
          })
        }
      }
      generatePDF(selectedSupplier, purchaseItems, total, purchaseDate)
      setShowPurchaseModal(false); loadData()
    } catch { alert('ERRO AO FINALIZAR COMPRA.') } finally { setIsFinishingPurchase(false) }
  }

  async function handleSaveSupplier() {
    if (!name) return
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const data = { user_id: user?.id, name: name.toUpperCase(), category, phone, link, notes }
      if (editingSupplier) await supabase.from('suppliers').update(data).eq('id', editingSupplier.id)
      else await supabase.from('suppliers').insert(data)
      closeFormModal(); loadData()
    } catch { alert('ERRO AO SALVAR.') } finally { setIsSaving(false) }
  }

  const filteredSuppliers = suppliers.filter(s => (filterType === 'TODOS' || s.category === filterType) && s.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold uppercase text-brand-primary">Gestão de Fornecedores</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Tecnologia para Galvanoplastia e Atacado 💎</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40" size={16} />
          <input type="text" placeholder="BUSCAR..." className="w-full pl-12 pr-4 py-4 rounded-[25px] bg-white border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none focus:border-brand-primary" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex bg-white p-1 rounded-[25px] border border-brand-secondary/10 overflow-hidden">
          {(['TODOS', 'BRUTO', 'FOLHADO', 'GALVANICA'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-4 py-2 rounded-[20px] text-[8px] font-black uppercase transition-all ${filterType === t ? 'bg-brand-primary text-white' : 'text-brand-secondary hover:bg-rose-50'}`}>{t}</button>
          ))}
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-brand-primary text-white px-8 py-4 rounded-[25px] font-black text-[10px] uppercase flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Plus size={18}/> Novo Fornecedor</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full text-center py-20"><Loader2 className="animate-spin inline text-brand-secondary"/></div> : filteredSuppliers.map((s) => (
          <div key={s.id} className="bg-white p-6 rounded-[40px] border border-brand-secondary/5 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.category === 'GALVANICA' ? 'bg-amber-100 text-amber-700' : s.category === 'BRUTO' ? 'bg-zinc-100 text-zinc-700' : 'bg-rose-100 text-rose-700'}`}><Store size={24}/></div>
              <div><h3 className="text-xs font-bold text-brand-primary uppercase">{s.name}</h3><span className="text-[7px] font-black px-2 py-1 rounded-full bg-brand-primary/5 text-brand-secondary uppercase tracking-widest">{s.category}</span></div>
            </div>
            <div className="mt-auto space-y-2">
              <button onClick={() => { setSelectedSupplier(s); setShowPurchaseModal(true) }} className="w-full bg-brand-primary text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase shadow-lg"><Receipt size={14}/> Registrar Compra</button>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => openEditModal(s)} className="p-2 text-brand-secondary hover:text-brand-primary"><Pencil size={16}/></button>
              <button onClick={() => { if(confirm('EXCLUIR?')) { supabase.from('suppliers').delete().eq('id', s.id).then(() => loadData()) } }} className="p-2 text-rose-200 hover:text-rose-500"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      {showPurchaseModal && selectedSupplier && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-brand-secondary/10 flex justify-between items-center bg-rose-50/20">
              <div><h3 className="text-xl font-bold text-brand-primary uppercase">Romaneio de {selectedSupplier.category}</h3><p className="text-[9px] font-black text-brand-secondary mt-1">{selectedSupplier.name}</p></div>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border-2 border-brand-primary text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
                   {isReadingPhoto ? <Loader2 size={14} className="animate-spin"/> : <><Sparkles size={14}/> Anexar Foto/PDF</>}
                   <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handlePhotoUpload}/>
                </label>
                <button onClick={() => setShowPurchaseModal(false)} className="p-2 hover:bg-rose-100 rounded-full text-brand-primary"><X size={24}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-brand-primary/5 p-4 rounded-3xl border border-brand-primary/10 flex items-center gap-3">
                  <Calendar className="text-brand-primary" size={20}/><input type="date" className="bg-transparent border-none outline-none text-xs font-bold text-brand-primary w-full" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}/>
                </div>
                {selectedSupplier.category === 'GALVANICA' && (
                  <div className="bg-amber-50 p-4 rounded-3xl border border-amber-200 flex items-center gap-3">
                    <Coins className="text-amber-600" size={20}/><div className="flex-1"><label className="text-[8px] font-black text-amber-700 uppercase block">Ouro do Dia (R$/g)</label><input type="number" className="bg-transparent border-none outline-none text-xs font-bold text-amber-800 w-full" value={globalGoldPrice} onChange={(e) => setGlobalGoldPrice(parseFloat(e.target.value) || 0)}/></div>
                  </div>
                )}
              </div>

              {purchaseItems.map((item, index) => (
                <div key={index} className="bg-white p-5 rounded-[30px] border border-brand-secondary/10 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-3">
                      <label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Peça</label>
                      <select className="w-full px-3 py-2 rounded-xl bg-rose-50/30 text-[9px] font-bold uppercase outline-none" value={item.productId || ''} onChange={(e) => {
                        const p = products.find(prod => prod.id === e.target.value);
                        setPurchaseItems(prev => { const n = [...prev]; n[index] = { ...n[index], productId: e.target.value, name: p?.name || '' }; return n; });
                      }}>
                        <option value="">-- SELECIONE --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                    
                    {selectedSupplier.category === 'GALVANICA' && (
                      <div className="md:col-span-2">
                        <label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Banho</label>
                        <select className="w-full px-3 py-2 rounded-xl bg-amber-50 text-[8px] font-black uppercase outline-none border border-amber-100" value={item.bathType} onChange={(e) => {
                          setPurchaseItems(prev => { const n = [...prev]; n[index].bathType = e.target.value as any; n[index].unitCost = calculateItemCost(n[index]); return n; });
                        }}>
                          <option value="OURO">OURO</option>
                          <option value="PRATA 30">PRATA 30</option>
                          <option value="PRATA 50">PRATA 50</option>
                          <option value="PRATA 70">PRATA 70</option>
                          <option value="RODIO BRANCO">RÓDIO BRANCO</option>
                          <option value="RODIO NEGRO">RÓDIO NEGRO</option>
                        </select>
                      </div>
                    )}

                    <div className="md:col-span-1"><label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Qnt</label><input type="number" className="w-full px-2 py-2 rounded-xl bg-rose-50/30 text-[10px] font-bold text-center" value={item.quantity} onChange={(e) => {
                      setPurchaseItems(prev => { const n = [...prev]; n[index].quantity = parseInt(e.target.value) || 0; return n; });
                    }}/></div>
                    
                    {selectedSupplier.category === 'GALVANICA' ? (
                      <>
                        <div className="md:col-span-1"><label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Mils</label><input type="number" disabled={item.bathType !== 'OURO'} className="w-full px-2 py-2 rounded-xl bg-rose-50/30 text-[10px] font-bold text-center disabled:opacity-30" value={item.microns} onChange={(e) => {
                          setPurchaseItems(prev => { const n = [...prev]; const mic = parseInt(e.target.value) || 0; n[index].microns = mic; n[index].unitCost = calculateItemCost(n[index]); return n; });
                        }}/></div>
                        <div className="md:col-span-2"><label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Peso (g)</label><input type="number" className="w-full px-2 py-2 rounded-xl bg-rose-50/30 text-[10px] font-bold text-center" value={item.grams} onChange={(e) => {
                          setPurchaseItems(prev => { const n = [...prev]; const gr = parseFloat(e.target.value) || 0; n[index].grams = gr; n[index].unitCost = calculateItemCost(n[index]); return n; });
                        }}/></div>
                        <div className="md:col-span-2"><label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">M.O.</label><input type="number" placeholder="R$ 0.00" className="w-full px-2 py-2 rounded-xl bg-rose-50/30 text-[10px] font-bold text-center" value={item.laborCost} onChange={(e) => {
                          setPurchaseItems(prev => { const n = [...prev]; const lb = parseFloat(e.target.value) || 0; n[index].laborCost = lb; n[index].unitCost = calculateItemCost(n[index]); return n; });
                        }}/></div>
                      </>
                    ) : (
                      <div className="md:col-span-7"><label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Custo Unitário (R$)</label><input type="number" className="w-full px-4 py-2 rounded-xl bg-rose-50/30 text-[10px] font-bold" value={item.unitCost} onChange={(e) => {
                        setPurchaseItems(prev => { const n = [...prev]; n[index].unitCost = parseFloat(e.target.value) || 0; return n; });
                      }}/></div>
                    )}
                    <div className="md:col-span-1 flex justify-end"><button onClick={() => setPurchaseItems(prev => prev.filter((_, i) => i !== index))} className="p-2 text-rose-300 hover:text-rose-500"><Trash2 size={16}/></button></div>
                  </div>
                  {selectedSupplier.category === 'GALVANICA' && (
                    <div className="pt-2 border-t border-dashed border-brand-secondary/10 flex justify-between text-[8px] font-black uppercase text-brand-secondary">
                      <span>Cálculo: {item.bathType === 'OURO' ? '(Peso x Ouro) + (Mil x M.O.)' : '(Peso x M.O. por grama)'}</span>
                      <span className="text-brand-primary text-[10px]">Custo: R$ {item.unitCost.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setPurchaseItems([...purchaseItems, { name: '', quantity: 1, unitCost: 0, bathType: 'OURO' }])} className="w-full py-4 border-2 border-dashed border-brand-secondary/20 rounded-[30px] text-[8px] font-black uppercase text-brand-secondary hover:bg-brand-secondary/5 transition-all flex items-center justify-center gap-2 mt-4"><Plus size={14}/> Adicionar Item</button>
            </div>

            <div className="p-6 border-t border-brand-secondary/10 bg-white flex justify-between items-center">
              <div><p className="text-[8px] font-black text-brand-secondary uppercase">Investimento Total</p><h4 className="text-2xl font-bold text-brand-primary">R$ {purchaseItems.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0).toLocaleString('pt-BR')}</h4></div>
              <button onClick={handleFinishPurchase} disabled={isFinishingPurchase} className="bg-brand-primary text-white px-10 py-4 rounded-[25px] font-black text-[10px] uppercase shadow-2xl transition-all disabled:opacity-50">{isFinishingPurchase ? <Loader2 className="animate-spin" size={18}/> : 'Finalizar & Gerar PDF'}</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-brand-primary uppercase mb-6 text-center">{editingSupplier ? 'Editar' : 'Novo'} Fornecedor</h3>
            <div className="space-y-4">
              <div><label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Nome</label><input type="text" className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none" value={name} onChange={(e) => setName(e.target.value)}/></div>
              <div>
                <label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Tipo de Fornecedor</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BRUTO', 'FOLHADO', 'GALVANICA'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setCategory(t)} className={`py-2 rounded-xl text-[8px] font-black uppercase transition-all ${category === t ? 'bg-brand-primary text-white' : 'bg-rose-50 text-brand-secondary hover:bg-rose-100'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Whats</label><input type="text" className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold" value={phone} onChange={(e) => setPhone(e.target.value)}/></div>
                <div><label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Site</label><input type="text" className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold" value={link} onChange={(e) => setLink(e.target.value)}/></div>
              </div>
              <div><label className="text-[7px] font-black text-brand-secondary uppercase block mb-1">Notas</label><textarea className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold h-20 outline-none" value={notes} onChange={(e) => setNotes(e.target.value)}/></div>
            </div>
            <div className="flex gap-4 mt-8"><button type="button" onClick={closeFormModal} className="flex-1 py-4 text-[9px] font-black uppercase text-brand-secondary">Cancelar</button><button type="button" onClick={handleSaveSupplier} disabled={isSaving} className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-black text-[9px] uppercase shadow-xl flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={14}/> : 'Salvar'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
