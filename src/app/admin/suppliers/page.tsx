'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Loader2, Phone, ExternalLink, Trash2, Search, Store, Receipt, ShoppingBag, X, Check, Camera, Sparkles, Pencil, Calendar, Coins, Hammer, Layers, Droplet, Beaker, Info, Calculator, FileText } from 'lucide-react'
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

interface PurchaseItem {
  name: string
  material: 'OURO' | 'PRATA' | 'RODIO' | 'VERNIZ' | 'COBRE' | 'OUTROS'
  logicType: 'MILESIMOS' | 'FIXO'
  weightGrams: number
  milesimos: number
  metalQuote: number
  laborCost: number
  fixedTablePrice: number // R$ por KG
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([{ 
    name: '', material: 'OURO', logicType: 'MILESIMOS', weightGrams: 0, milesimos: 0, metalQuote: 0, laborCost: 0, fixedTablePrice: 0 
  }])
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  
  const [isFinishingPurchase, setIsFinishingPurchase] = useState(false)
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
    const { data } = await supabase.from('suppliers').select('*').eq('user_id', user.id).order('name')
    if (data) setSuppliers(data as Supplier[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const calculateLineTotal = (item: PurchaseItem) => {
    const weightKG = item.weightGrams / 1000
    if (item.logicType === 'MILESIMOS') {
      const costMil = item.metalQuote + item.laborCost
      return weightKG * (item.milesimos * costMil)
    } else {
      return weightKG * item.fixedTablePrice
    }
  }

  const totals = useMemo(() => {
    const subtotal = purchaseItems.reduce((acc, item) => acc + calculateLineTotal(item), 0)
    const weight = purchaseItems.reduce((acc, item) => acc + item.weightGrams, 0)
    return { subtotal, weight }
  }, [purchaseItems])

  const handleAddItem = () => {
    setPurchaseItems([...purchaseItems, { 
      name: '', material: 'OURO', logicType: 'MILESIMOS', weightGrams: 0, milesimos: 0, metalQuote: 0, laborCost: 0, fixedTablePrice: 0 
    }])
  }

  const handleUpdateItem = (index: number, fields: Partial<PurchaseItem>) => {
    const newItems = [...purchaseItems]
    newItems[index] = { ...newItems[index], ...fields }
    
    // Auto-switch logic based on material
    if (fields.material) {
      if (fields.material === 'OURO' || fields.material === 'PRATA') {
        newItems[index].logicType = 'MILESIMOS'
      } else {
        newItems[index].logicType = 'FIXO'
      }
    }
    
    setPurchaseItems(newItems)
  }

  const generatePDF = (supplier: Supplier, items: PurchaseItem[], finalTotals: any) => {
    const doc = new jsPDF()
    doc.setFontSize(22); doc.setTextColor(74, 50, 46); doc.text('LAPIDADO ERP', 105, 20, { align: 'center' })
    doc.setFontSize(10); doc.setTextColor(201, 144, 144); doc.text(`ROMANEIO DE CUSTOS DE BANHO - ${supplier.name}`, 105, 28, { align: 'center' })
    
    const body = items.map(i => {
      const total = calculateLineTotal(i)
      if (i.logicType === 'MILESIMOS') {
        return [i.name.toUpperCase(), i.material, `${i.weightGrams}g`, `${i.milesimos} mil`, `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
      }
      return [i.name.toUpperCase(), i.material, `${i.weightGrams}g`, 'Tabela Fixa', `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
    })

    autoTable(doc, {
      startY: 40,
      head: [['ITEM', 'MATERIAL', 'PESO', 'DETALHES', 'SUBTOTAL']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [74, 50, 46] }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(14); doc.text(`TOTAL DO ROMANEIO: R$ ${finalTotals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 190, finalY, { align: 'right' })
    doc.save(`romaneio-${supplier.name.toLowerCase()}.pdf`)
  }

  const handleFinish = async () => {
    if (!selectedSupplier) return
    setIsFinishingPurchase(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: purchase } = await supabase.from('purchases').insert({ 
        user_id: user?.id, supplier_id: selectedSupplier.id, total_amount: totals.subtotal, created_at: new Date(purchaseDate).toISOString() 
      }).select().single()
      
      if (purchase) {
        for (const item of purchaseItems) {
          await supabase.from('purchase_items').insert({ 
            purchase_id: purchase.id, name: item.name.toUpperCase(), quantity: 1, unit_cost: calculateLineTotal(item),
            notes: `${item.material} | ${item.weightGrams}g | ${item.logicType === 'MILESIMOS' ? item.milesimos + 'mil' : 'FIXO'}`
          })
        }
      }
      generatePDF(selectedSupplier, purchaseItems, totals)
      setShowPurchaseModal(false); loadData()
      toast.success('Romaneio salvo e PDF gerado! 💎')
    } catch { alert('Erro ao salvar.') } finally { setIsFinishingPurchase(false) }
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 px-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black uppercase text-brand-primary tracking-tighter">Gestão de Fornecedores</h2>
        <p className="text-brand-secondary text-[12px] font-black tracking-[0.4em] uppercase mt-2">Engenharia de Custos & ERP Industrial 💎</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-secondary/40 group-focus-within:text-brand-primary transition-all" size={20} />
           <input type="text" placeholder="BUSCAR FORNECEDOR OU TIPO..." className="w-full pl-16 pr-6 py-5 rounded-[30px] bg-white border border-brand-secondary/10 font-bold uppercase text-xs outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-brand-primary text-white px-10 py-5 rounded-[30px] font-black text-xs uppercase flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"><Plus size={20}/> Novo Parceiro</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? <div className="col-span-full text-center py-20"><Loader2 className="animate-spin inline text-brand-secondary" size={40}/></div> : 
          suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((s) => (
          <div key={s.id} className="bg-white p-8 rounded-[45px] border border-brand-secondary/5 shadow-sm hover:shadow-2xl transition-all group relative">
            <div className="flex items-center gap-5 mb-8">
              <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-inner ${s.category === 'GALVANICA' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-brand-primary'}`}><Store size={32}/></div>
              <div>
                <h3 className="text-lg font-black text-brand-primary uppercase leading-tight">{s.name}</h3>
                <span className="text-[9px] font-black px-3 py-1 rounded-full bg-brand-primary/5 text-brand-secondary uppercase tracking-[0.2em]">{s.category}</span>
              </div>
            </div>
            
            <div className="space-y-3 mb-8">
               {s.phone && <div className="flex items-center gap-2 text-[10px] font-bold text-brand-secondary/60 uppercase"><Phone size={14} className="text-brand-primary/40"/> {s.phone}</div>}
               <div className="flex items-center gap-2 text-[10px] font-bold text-brand-secondary/60 uppercase"><FileText size={14} className="text-brand-primary/40"/> {s.notes || 'Sem observações'}</div>
            </div>

            <button onClick={() => { setSelectedSupplier(s); setShowPurchaseModal(true) }} className="w-full bg-brand-primary text-white py-4 rounded-[20px] flex items-center justify-center gap-3 text-[10px] font-black uppercase shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all">
              <Calculator size={16}/> Lançar Custos de Banho
            </button>
            
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => { setEditingSupplier(s); setName(s.name); setCategory(s.category); setPhone(s.phone || ''); setNotes(s.notes || ''); setShowAddModal(true) }} className="p-3 bg-white rounded-xl shadow-md text-brand-secondary hover:text-brand-primary transition-all"><Pencil size={18}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* 🚀 MODAL DE LANÇAMENTO DE CUSTOS (FORMULAS) */}
      {showPurchaseModal && selectedSupplier && (
        <div className="fixed inset-0 bg-brand-primary/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-7xl h-[92vh] rounded-[50px] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-8 border-b border-brand-secondary/10 flex justify-between items-center bg-rose-50/20">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-brand-primary rounded-2xl text-white shadow-lg"><Calculator size={24}/></div>
                 <div>
                    <h3 className="text-2xl font-black text-brand-primary uppercase tracking-tighter">Cálculo ERP: {selectedSupplier.name}</h3>
                    <p className="text-[10px] font-bold text-brand-secondary/50 uppercase tracking-[0.2em]">Fórmulas de milésimos e tabela fixa ativas</p>
                 </div>
              </div>
              <button onClick={() => setShowPurchaseModal(false)} className="p-4 hover:bg-rose-100 rounded-full text-brand-primary transition-all"><X size={32}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-rose-50/5">
              <div className="flex items-center gap-4 bg-white p-6 rounded-[30px] border border-brand-secondary/5 shadow-sm max-w-xs">
                <Calendar className="text-brand-primary" size={24}/>
                <div className="flex-1">
                  <label className="text-[9px] font-black uppercase text-brand-secondary/40 block mb-1">Data do Processo</label>
                  <input type="date" className="bg-transparent text-sm font-black w-full outline-none" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}/>
                </div>
              </div>

              <div className="space-y-4">
                {purchaseItems.map((item, index) => (
                  <div key={index} className="bg-white p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-end group relative">
                    <div className="lg:col-span-3 space-y-2">
                      <label className="text-[9px] font-black uppercase text-brand-secondary/40 ml-2">Descrição da Carga</label>
                      <input type="text" placeholder="EX: ANÉIS LISOS" className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-brand-primary/20" value={item.name} onChange={(e) => handleUpdateItem(index, { name: e.target.value })}/>
                    </div>
                    
                    <div className="lg:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-brand-secondary/40 ml-2">Serviço/Material</label>
                      <select className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-xs font-black outline-none appearance-none" value={item.material} onChange={(e) => handleUpdateItem(index, { material: e.target.value as any })}>
                        <option value="OURO">BANHO OURO</option>
                        <option value="PRATA">BANHO PRATA</option>
                        <option value="RODIO">RÓDIO BRANCO/NEGRO</option>
                        <option value="VERNIZ">VERNIZ/PROTEÇÃO</option>
                        <option value="COBRE">COBRE/BASE</option>
                      </select>
                    </div>

                    <div className="lg:col-span-1 space-y-2">
                      <label className="text-[9px] font-black uppercase text-brand-secondary/40 ml-2 text-center block">Peso (G)</label>
                      <input type="number" className="w-full px-2 py-4 rounded-2xl bg-brand-secondary/5 text-xs font-black text-center outline-none" value={item.weightGrams || ''} onChange={(e) => handleUpdateItem(index, { weightGrams: parseFloat(e.target.value) || 0 })}/>
                    </div>

                    {item.logicType === 'MILESIMOS' ? (
                      <>
                        <div className="lg:col-span-1 space-y-2">
                          <label className="text-[9px] font-black uppercase text-brand-secondary/40 ml-2 text-center block">Milésimos</label>
                          <input type="number" className="w-full px-2 py-4 rounded-2xl bg-amber-50 border border-amber-100 text-xs font-black text-center text-amber-700 outline-none" value={item.milesimos || ''} onChange={(e) => handleUpdateItem(index, { milesimos: parseFloat(e.target.value) || 0 })}/>
                        </div>
                        <div className="lg:col-span-2 space-y-2">
                          <label className="text-[9px] font-black uppercase text-brand-secondary/40 ml-2 block">Cotação Metal (G)</label>
                          <input type="number" className="w-full px-5 py-4 rounded-2xl bg-amber-50 border border-amber-100 text-xs font-black text-amber-700 outline-none" value={item.metalQuote || ''} onChange={(e) => handleUpdateItem(index, { metalQuote: parseFloat(e.target.value) || 0 })}/>
                        </div>
                        <div className="lg:col-span-2 space-y-2">
                          <label className="text-[9px] font-black uppercase text-brand-secondary/40 ml-2 block">M.O. p/ Milésimo</label>
                          <input type="number" className="w-full px-5 py-4 rounded-2xl bg-amber-50 border border-amber-100 text-xs font-black text-amber-700 outline-none" value={item.laborCost || ''} onChange={(e) => handleUpdateItem(index, { laborCost: parseFloat(e.target.value) || 0 })}/>
                        </div>
                      </>
                    ) : (
                      <div className="lg:col-span-5 space-y-2">
                        <label className="text-[9px] font-black uppercase text-brand-secondary/40 ml-2 block">Valor Tabela Fixa (R$ p/ KG)</label>
                        <input type="number" className="w-full px-5 py-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs font-black text-blue-700 outline-none" value={item.fixedTablePrice || ''} onChange={(e) => handleUpdateItem(index, { fixedTablePrice: parseFloat(e.target.value) || 0 })}/>
                      </div>
                    )}

                    <div className="lg:col-span-1 flex flex-col items-end justify-center pb-2">
                       <p className="text-[8px] font-black text-brand-secondary/40 uppercase mb-1">Subtotal</p>
                       <p className="text-sm font-black text-brand-primary tracking-tighter">R$ {calculateLineTotal(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                       <button onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== index))} className="absolute -top-4 -right-4 p-3 bg-rose-50 text-rose-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleAddItem} className="w-full py-6 border-4 border-dashed border-brand-secondary/10 rounded-[40px] text-xs font-black uppercase text-brand-secondary/40 hover:bg-brand-secondary/5 hover:text-brand-primary transition-all flex items-center justify-center gap-3"><Plus size={20}/> Adicionar Outra Carga ao Romaneio</button>
            </div>

            <div className="p-10 border-t border-brand-secondary/10 bg-white flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex gap-12">
                 <div className="text-center md:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/40 mb-1">Peso Total da Carga</p>
                    <div className="flex items-end gap-2">
                       <span className="text-3xl font-black text-brand-primary">{totals.weight}</span>
                       <span className="text-sm font-black text-brand-secondary/40 mb-1 uppercase">Gramas</span>
                    </div>
                 </div>
                 <div className="text-center md:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/40 mb-1">Investimento Total</p>
                    <div className="flex items-end gap-2 text-brand-primary">
                       <span className="text-sm font-black mb-1">R$</span>
                       <span className="text-4xl font-black tracking-tighter">{totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                 </div>
              </div>
              <button onClick={handleFinish} disabled={isFinishingPurchase} className="bg-brand-primary text-white px-16 py-6 rounded-[30px] font-black text-sm uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50">
                {isFinishingPurchase ? <Loader2 className="animate-spin" size={24}/> : <><Check size={24}/> FINALIZAR ROMANEIO & ERP</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR FORNECEDOR (SIMPLIFICADO) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-brand-primary/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[50px] p-10 shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-brand-primary uppercase mb-8 text-center">{editingSupplier ? 'Ajustar' : 'Novo'} Parceiro</h3>
              <div className="space-y-5">
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-brand-secondary/40 ml-2">Nome do Fornecedor</label><input type="text" className="w-full px-6 py-4 rounded-2xl bg-brand-secondary/5 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-brand-primary" value={name} onChange={e => setName(e.target.value)} /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-brand-secondary/40 ml-2">WhatsApp</label><input type="text" className="w-full px-6 py-4 rounded-2xl bg-brand-secondary/5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-brand-secondary/40 ml-2">Categoria</label><select className="w-full px-4 py-4 rounded-2xl bg-brand-secondary/5 text-xs font-black outline-none" value={category} onChange={e => setCategory(e.target.value as any)}><option value="BRUTO">BRUTO</option><option value="GALVANICA">GALVANICA</option><option value="FOLHADO">FOLHADO</option></select></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-brand-secondary/40 ml-2">Site/Link</label><input type="text" className="w-full px-6 py-4 rounded-2xl bg-brand-secondary/5 text-sm font-bold outline-none" value={link} onChange={e => setLink(e.target.value)} /></div>
                 </div>
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-brand-secondary/40 ml-2">Observações Internas</label><textarea className="w-full px-6 py-4 rounded-2xl bg-brand-secondary/5 text-sm font-bold h-24 outline-none" value={notes} onChange={e => setNotes(e.target.value)} /></div>
              </div>
              <div className="flex gap-4 mt-10"><button onClick={() => setShowAddModal(false)} className="flex-1 py-5 text-xs font-black uppercase text-brand-secondary">Cancelar</button><button onClick={handleSaveSupplier} disabled={isSaving} className="flex-1 bg-brand-primary text-white py-5 rounded-[25px] font-black text-xs uppercase shadow-xl flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={16}/> : 'Confirmar Registro'}</button></div>
           </div>
        </div>
      )}
    </div>
  )
}
