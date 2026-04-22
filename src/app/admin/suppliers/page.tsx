'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, Phone, ExternalLink, Trash2, Search, Store, Receipt, ShoppingBag, X, Check, Camera, Sparkles, Pencil, Calendar, Coins, Hammer, Layers, Droplet, Beaker, Info } from 'lucide-react'
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
  // Campos Industriais Galvânica
  weightKg: number
  material: 'OURO' | 'RODIO' | 'PRATA' | 'VERNIZ' | 'COBRE' | 'OUTROS'
  teor: number
  tablePrice: number
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([{ 
    name: '', quantity: 1, unitCost: 0, weightKg: 0, material: 'OURO', teor: 0, tablePrice: 0 
  }])
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [goldQuote, setGoldQuote] = useState(0)
  const [extraLabor, setExtraLabor] = useState(0)
  
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

  // 💎 LÓGICA INDUSTRIAL: Identêntica à Planilha da Ângela
  const calculateTotals = () => {
    const isIndustrial = selectedSupplier?.category === 'GALVANICA' || selectedSupplier?.category === 'BRUTO';
    
    // 1. Subtotal (Igual à coluna VALOR da planilha)
    const subtotal = purchaseItems.reduce((acc, item) => {
      return acc + (item.weightKg * item.tablePrice);
    }, 0);

    // 2. Transparência do Ouro (Apenas linhas de OURO)
    const goldItems = purchaseItems.filter(i => i.material === 'OURO');
    const goldGrams = goldItems.reduce((acc, i) => acc + (i.weightKg * i.teor), 0);
    const goldRealCost = Math.round(goldGrams * goldQuote * 100) / 100;

    // 3. Mão de Obra por Milésimos (Soma de todos os Pesos * Teores * Taxa MO)
    const totalMO = purchaseItems.reduce((acc, item) => {
      if (isIndustrial && extraLabor > 0) {
        return acc + (item.weightKg * item.teor * extraLabor);
      }
      return acc;
    }, 0);

    // 4. Total Final com arredondamento preciso
    const subtotalRounded = Math.round(subtotal * 100) / 100;
    const totalMORounded = Math.round(totalMO * 100) / 100;
    const totalFinal = Math.round((subtotalRounded + (selectedSupplier?.category === 'GALVANICA' ? totalMORounded : extraLabor)) * 100) / 100;
    const totalWeight = purchaseItems.reduce((acc, item) => acc + item.weightKg, 0);

    return { 
      subtotal: subtotalRounded, 
      totalFinal, 
      totalWeight, 
      goldGrams: Math.round(goldGrams * 1000) / 1000, 
      goldRealCost, 
      totalMO: totalMORounded 
    };
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
          const mapped = data.map(item => ({ 
            name: item.name,
            quantity: item.quantity || 1,
            weightKg: 0,
            material: 'OURO' as const,
            teor: 0,
            tablePrice: item.unitCost || 0,
            unitCost: 0
          }))
          setPurchaseItems(mapped as any); alert('DADOS EXTRAÍDOS! 💎')
        }
      } catch { alert('ERRO NO PROCESSAMENTO.') } finally { setIsReadingPhoto(false) }
    }
    reader.readAsDataURL(file)
  }

  const generatePDF = (supplier: Supplier, items: PurchaseItem[], totals: any, dateStr: string) => {
    const doc = new jsPDF()
    const date = dateStr.split('-').reverse().join('/')
    doc.setFontSize(20); doc.setTextColor(74, 50, 46); doc.text('LAPIDADO', 105, 20, { align: 'center' })
    doc.setFontSize(10); doc.setTextColor(201, 144, 144); doc.text(`ROMANEIO INDUSTRIAL - ${supplier.category}`, 105, 27, { align: 'center' })
    doc.line(20, 35, 190, 35)
    
    doc.setFontSize(10); doc.setTextColor(74, 50, 46)
    doc.text(`FORNECEDOR: ${supplier.name}`, 20, 42); doc.text(`DATA: ${date}`, 190, 42, { align: 'right' })

    const head = (supplier.category === 'GALVANICA' || supplier.category === 'BRUTO')
      ? [['DESCRIÇÃO', 'MAT.', 'PESO (KG)', 'TEOR', 'TABELA (KG)', 'TOTAL']]
      : [['ITEM', 'QNT', 'CUSTO UN.', 'TOTAL']]

    const body = items.map(i => (supplier.category === 'GALVANICA' || supplier.category === 'BRUTO')
      ? [i.name.toUpperCase(), i.material, i.weightKg.toFixed(3), `${i.teor} mil`, `R$ ${i.tablePrice.toLocaleString('pt-BR')}`, `R$ ${(i.weightKg * i.tablePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
      : [i.name.toUpperCase(), i.quantity, `R$ ${i.unitCost.toLocaleString('pt-BR')}`, `R$ ${(i.quantity * i.unitCost).toLocaleString('pt-BR')}`]
    )

    autoTable(doc, { startY: 48, head, body, theme: 'striped', headStyles: { fillColor: [74, 50, 46] } })

    if (supplier.category === 'GALVANICA' || supplier.category === 'BRUTO') {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`PESO TOTAL: ${totals.totalWeight.toFixed(3)} KG`, 20, finalY);
      if (supplier.category === 'GALVANICA') {
        doc.text(`TRANSPARÊNCIA OURO GASTO: ${totals.goldGrams.toFixed(2)}g (R$ ${totals.goldRealCost.toLocaleString('pt-BR')})`, 20, finalY + 6);
      }
      doc.setFontSize(12);
      doc.text(`TOTAL FINAL: R$ ${totals.totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 190, finalY + 10, { align: 'right' });
    }

    doc.save(`romaneio-${supplier.name.toLowerCase()}.pdf`)
  }

  const handleFinishPurchase = async () => {
    if (!selectedSupplier) return
    setIsFinishingPurchase(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const totals = calculateTotals()
      const { data: purchase } = await supabase.from('purchases').insert({ 
        user_id: user?.id, supplier_id: selectedSupplier.id, total_amount: totals.totalFinal, created_at: new Date(purchaseDate).toISOString() 
      }).select().single()
      
      if (purchase) {
        for (const item of purchaseItems) {
          const isIndustrial = selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO';
          const lineCost = isIndustrial ? (item.weightKg * item.tablePrice) : item.unitCost;
          await supabase.from('purchase_items').insert({ 
            purchase_id: purchase.id, product_id: item.productId || null, name: item.name.toUpperCase(), quantity: 1, unit_cost: lineCost,
            notes: isIndustrial ? `${item.material} | ${item.weightKg}kg | ${item.teor}mil` : ''
          })
        }
      }
      generatePDF(selectedSupplier, purchaseItems, totals, purchaseDate)
      setShowPurchaseModal(false); loadData()
    } catch { alert('ERRO AO FINALIZAR.') } finally { setIsFinishingPurchase(false) }
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
    } catch { alert('ERRO.') } finally { setIsSaving(false) }
  }

  async function handleDeleteSupplier(id: string) {
    if (!confirm('DESEJA EXCLUIR ESTE FORNECEDOR? ESTA AÇÃO NÃO PODE SER DESFEITA. 💎')) return
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
      setSuppliers(prev => prev.filter(s => s.id !== id))
      alert('FORNECEDOR EXCLUÍDO! 🗑️')
    } catch (err: any) {
      alert('ERRO AO EXCLUIR: ' + err.message)
    }
  }

  const closeFormModal = () => {
    setShowAddModal(false); setEditingSupplier(null); setName(''); setCategory('BRUTO'); setPhone(''); setLink(''); setNotes('')
  }

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s); setName(s.name); setCategory(s.category); setPhone(s.phone || ''); setLink(s.link || ''); setNotes(s.notes || ''); setShowAddModal(true)
  }

  const filteredSuppliers = suppliers.filter(s => (filterType === 'TODOS' || s.category === filterType) && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const { subtotal, totalFinal, totalWeight, goldGrams, goldRealCost } = calculateTotals()

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold uppercase text-brand-primary">Gestão de Fornecedores</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Industrial, Bruto & Folhado 💎</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input type="text" placeholder="BUSCAR..." className="flex-1 px-6 py-4 rounded-[25px] bg-white border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none focus:border-brand-primary" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
            <button onClick={() => { setSelectedSupplier(s); setShowPurchaseModal(true) }} className="w-full bg-brand-primary text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase shadow-lg mt-auto"><Receipt size={14}/> Registrar Compra</button>
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => openEditModal(s)} className="p-2 text-brand-secondary hover:text-brand-primary"><Pencil size={16}/></button>
              <button onClick={() => handleDeleteSupplier(s.id)} className="p-2 text-rose-300 hover:text-rose-500"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      {showPurchaseModal && selectedSupplier && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[95vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-brand-secondary/10 flex justify-between items-center bg-rose-50/20">
              <div><h3 className="text-xl font-bold text-brand-primary uppercase">Romaneio Industrial: {selectedSupplier.name}</h3></div>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border-2 border-brand-primary text-[9px] font-black uppercase hover:bg-brand-primary hover:text-white transition-all"><Sparkles size={14}/> Ler com IA <input type="file" className="hidden" onChange={handlePhotoUpload}/></label>
                <button onClick={() => setShowPurchaseModal(false)} className="p-2 hover:bg-rose-100 rounded-full text-brand-primary"><X size={24}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-brand-primary/5 p-4 rounded-3xl flex items-center gap-3">
                  <Calendar className="text-brand-primary" size={20}/><div className="flex-1"><label className="text-[8px] font-black uppercase block">Data</label><input type="date" className="bg-transparent text-xs font-bold w-full" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}/></div>
                </div>
                {(selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO') && (
                  <>
                    {selectedSupplier.category === 'GALVANICA' && (
                      <div className="bg-amber-50 p-4 rounded-3xl border border-amber-200 flex items-center gap-3">
                        <Coins className="text-amber-600" size={20}/><div className="flex-1"><label className="text-[8px] font-black uppercase block">Ouro do Dia (R$)</label><input type="number" className="bg-transparent text-xs font-bold w-full" value={goldQuote} onChange={(e) => setGoldQuote(parseFloat(e.target.value) || 0)}/></div>
                      </div>
                    )}
                    <div className="bg-blue-50 p-4 rounded-3xl border border-blue-200 flex items-center gap-3">
                      <Hammer className="text-blue-600" size={20}/><div className="flex-1"><label className="text-[8px] font-black uppercase block">M. Obra Extra (R$)</label><input type="number" className="bg-transparent text-xs font-bold w-full" value={extraLabor} onChange={(e) => setExtraLabor(parseFloat(e.target.value) || 0)}/></div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                {purchaseItems.map((item, index) => (
                  <div key={index} className="bg-rose-50/10 p-5 rounded-[30px] border border-brand-secondary/5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-3">
                      <label className="text-[7px] font-black uppercase block mb-1">Descrição</label>
                      <input type="text" className="w-full px-3 py-2 rounded-xl bg-white border border-brand-secondary/10 text-[10px] font-bold uppercase" value={item.name} onChange={(e) => {
                        const n = [...purchaseItems]; n[index].name = e.target.value; setPurchaseItems(n);
                      }}/>
                    </div>
                    {selectedSupplier.category === 'GALVANICA' && (
                      <div className="md:col-span-2">
                        <label className="text-[7px] font-black uppercase block mb-1">Material</label>
                        <select className="w-full px-3 py-2 rounded-xl bg-white border border-brand-secondary/10 text-[9px] font-bold" value={item.material} onChange={(e) => {
                          const n = [...purchaseItems]; n[index].material = e.target.value as any; setPurchaseItems(n);
                        }}>
                          <option value="OURO">OURO</option><option value="RODIO">RÓDIO</option><option value="PRATA">PRATA</option><option value="VERNIZ">VERNIZ</option><option value="COBRE">COBRE</option><option value="OUTROS">OUTROS</option>
                        </select>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="text-[7px] font-black uppercase block mb-1">{(selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO') ? 'Peso (KG)' : 'Quantidade'}</label>
                      <input type="number" className="w-full px-3 py-2 rounded-xl bg-white border border-brand-secondary/10 text-[10px] font-bold text-center" value={(selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO') ? item.weightKg : item.quantity} onChange={(e) => {
                        const n = [...purchaseItems]; 
                        if (selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO') n[index].weightKg = parseFloat(e.target.value) || 0;
                        else n[index].quantity = parseInt(e.target.value) || 0;
                        setPurchaseItems(n);
                      }}/>
                    </div>
                    {(selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO') && (
                      <div className="md:col-span-1">
                        <label className="text-[7px] font-black uppercase block mb-1">Teor</label>
                        <input type="number" className="w-full px-3 py-2 rounded-xl bg-white border border-brand-secondary/10 text-[10px] font-bold text-center" value={item.teor} onChange={(e) => {
                          const n = [...purchaseItems]; n[index].teor = parseInt(e.target.value) || 0; setPurchaseItems(n);
                        }}/>
                      </div>
                    )}
                    <div className="md:col-span-3">
                      <label className="text-[7px] font-black uppercase block mb-1">{(selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO') ? 'Valor Tabela (R$/KG)' : 'Custo Unitário (R$)'}</label>
                      <input type="number" className="w-full px-3 py-2 rounded-xl bg-white border border-brand-secondary/10 text-[10px] font-bold" value={(selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO') ? item.tablePrice : item.unitCost} onChange={(e) => {
                        const n = [...purchaseItems];
                        if (selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO') n[index].tablePrice = parseFloat(e.target.value) || 0;
                        else n[index].unitCost = parseFloat(e.target.value) || 0;
                        setPurchaseItems(n);
                      }}/>
                    </div>
                    {(selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO') && (
                      <div className="md:col-span-1">
                        <label className="text-[7px] font-black uppercase block mb-1 text-right">Total</label>
                        <p className="text-[10px] font-black text-brand-primary text-right py-2">
                          R$ {(item.weightKg * item.tablePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    <div className="md:col-span-1 flex justify-end"><button onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== index))} className="p-2 text-rose-300 hover:text-rose-500"><Trash2 size={16}/></button></div>
                  </div>
                ))}
              </div>
              <button onClick={() => setPurchaseItems([...purchaseItems, { name: '', quantity: 1, unitCost: 0, weightKg: 0, material: 'OURO', teor: 0, tablePrice: 0 }])} className="w-full py-4 border-2 border-dashed border-brand-secondary/20 rounded-[30px] text-[8px] font-black uppercase text-brand-secondary hover:bg-brand-secondary/5 transition-all flex items-center justify-center gap-2"><Plus size={14}/> Adicionar Nova Linha</button>
            </div>

            <div className="p-6 border-t border-brand-secondary/10 bg-white flex flex-col md:flex-row justify-between items-center gap-6">
              {(selectedSupplier.category === 'GALVANICA' || selectedSupplier.category === 'BRUTO') ? (
                <div className="flex flex-col md:flex-row gap-8 bg-brand-primary/5 p-4 rounded-3xl border border-brand-primary/10 w-full md:w-auto">
                  {selectedSupplier.category === 'GALVANICA' && (
                    <div className="text-center md:text-left">
                      <p className="text-[7px] font-black uppercase tracking-widest text-brand-secondary flex items-center gap-1"><Info size={10}/> Transparência do Ouro</p>
                      <div className="flex gap-4 mt-1">
                        <div><span className="text-[8px] block opacity-50">CONSUMO</span><span className="text-xs font-bold text-amber-700">{goldGrams.toFixed(2)}g</span></div>
                        <div><span className="text-[8px] block opacity-50">VALOR METAL</span><span className="text-xs font-bold text-amber-700">R$ {goldRealCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                      </div>
                    </div>
                  )}
                  <div className={`text-center md:text-left ${selectedSupplier.category === 'GALVANICA' ? 'border-l border-brand-primary/20 pl-8' : ''}`}>
                    <p className="text-[7px] font-black uppercase tracking-widest text-brand-secondary">Resumo Financeiro</p>
                    <div className="flex gap-4 mt-1">
                      <div><span className="text-[8px] block opacity-50">PESO TOTAL</span><span className="text-xs font-bold">{totalWeight.toFixed(3)} KG</span></div>
                      <div><span className="text-[8px] block opacity-50">SUBTOTAL</span><span className="text-xs font-bold">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                      <div className="pl-4 border-l border-brand-primary/20"><span className="text-[8px] block opacity-50">TOTAL FINAL</span><span className="text-xs font-bold text-brand-primary">R$ {totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div><p className="text-[8px] font-black uppercase">Total do Romaneio</p><h4 className="text-2xl font-bold text-brand-primary">R$ {purchaseItems.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0).toLocaleString('pt-BR')}</h4></div>
              )}
              <button onClick={handleFinishPurchase} disabled={isFinishingPurchase} className="bg-brand-primary text-white px-10 py-4 rounded-[25px] font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all">{isFinishingPurchase ? <Loader2 className="animate-spin" size={18}/> : 'Finalizar & Baixar PDF'}</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-brand-primary uppercase mb-6 text-center">{editingSupplier ? 'Editar' : 'Novo'} Fornecedor</h3>
            <div className="space-y-4">
              <div><label className="text-[7px] font-black block mb-1 uppercase">Nome</label><input type="text" className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase" value={name} onChange={(e) => setName(e.target.value)}/></div>
              <div><label className="text-[7px] font-black block mb-1 uppercase">Tipo</label><div className="grid grid-cols-3 gap-2">{(['BRUTO', 'FOLHADO', 'GALVANICA'] as const).map(t => (<button key={t} type="button" onClick={() => setCategory(t)} className={`py-2 rounded-xl text-[8px] font-black uppercase transition-all ${category === t ? 'bg-brand-primary text-white' : 'bg-rose-50 text-brand-secondary'}`}>{t}</button>))}</div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[7px] font-black block mb-1 uppercase">Whats</label><input type="text" className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold" value={phone} onChange={(e) => setPhone(e.target.value)}/></div>
                <div><label className="text-[7px] font-black block mb-1 uppercase">Site</label><input type="text" className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold" value={link} onChange={(e) => setLink(e.target.value)}/></div>
              </div>
              <div><label className="text-[7px] font-black block mb-1 uppercase">Notas</label><textarea className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold h-20 outline-none" value={notes} onChange={(e) => setNotes(e.target.value)}/></div>
            </div>
            <div className="flex gap-4 mt-8"><button type="button" onClick={closeFormModal} className="flex-1 py-4 text-[9px] font-black uppercase text-brand-secondary">Cancelar</button><button type="button" onClick={handleSaveSupplier} disabled={isSaving} className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-black text-[9px] uppercase shadow-xl flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={14}/> : 'Salvar'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
