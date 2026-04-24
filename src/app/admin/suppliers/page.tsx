'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Loader2, Phone, ExternalLink, Trash2, Search, Store, Receipt, ShoppingBag, X, Check, Camera, Sparkles, Pencil, Calendar, Coins, Hammer, Layers, Droplet, Beaker, Info, Calculator, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'

interface Supplier {
  id: string
  created_at: string
  name: string
  category: 'BRUTO' | 'FOLHADO' | 'GALVANICA'
  phone?: string
  link?: string
  notes?: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  
  // 1. ESTADOS PARA GALVANICA (CALCULADORA TÉCNICA)
  const [goldQuote, setGoldQuote] = useState<number>(0)
  const [platingLabor, setPlatingLabor] = useState<number>(0)
  const [silverKgPrice, setSilverKgPrice] = useState<number>(0)
  const [rhodiumKgPrice, setRhodiumKgPrice] = useState<number>(0)
  const [varnishKgPrice, setVarnishKgPrice] = useState<number>(0)
  const [batchWeightG, setBatchWeightG] = useState<number>(0)
  const [selectedMaterial, setSelectedMaterial] = useState<'OURO' | 'PRATA' | 'RODIO' | 'VERNIZ'>('OURO')
  const [milQuantity, setMilQuantity] = useState<number>(0)

  // 2. ESTADOS PARA BRUTO / FOLHADO (LANÇAMENTO SIMPLES)
  const [purchaseItems, setPurchaseItems] = useState<{product_id?: string, name: string, quantity: number, unitCost: number}[]>([
    { name: '', quantity: 1, unitCost: 0 }
  ])
  
  const [products, setProducts] = useState<any[]>([])
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [isFinishingPurchase, setIsFinishingPurchase] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [name, setName] = useState('')
  const [category, setCategory] = useState<'BRUTO' | 'FOLHADO' | 'GALVANICA'>('BRUTO')
  const [phone, setPhone] = useState('')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')

  const supabase = createClient()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Carregar Fornecedores
    const { data: suppliersData } = await supabase.from('suppliers').select('*').eq('user_id', user.id).order('name')
    if (suppliersData) setSuppliers(suppliersData as Supplier[])

    // Carregar Produtos para seleção
    const { data: prodsData } = await supabase.from('products').select('id, name, price, cost_price').eq('user_id', user.id).order('name')
    if (prodsData) setProducts(prodsData)

    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // 💎 NEXUS: Função para selecionar produto e preencher nome/custo
  const handleSelectProduct = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId)
    if (prod) {
      const newItems = [...purchaseItems]
      newItems[index] = {
        ...newItems[index],
        product_id: prod.id,
        name: prod.name.toUpperCase(),
        unitCost: prod.cost_price || 0
      }
      setPurchaseItems(newItems)
    }
  }

  // 3. CÁLCULOS AUTOMATIZADOS (MEMO)
  const results = useMemo(() => {
    // Cálculo Galvânica: (Cotação Ouro + Mão de Obra) * Milésimos * (Peso Total / 1000)
    const weightInKg = (batchWeightG || 0) / 1000
    let galvaPricePerKg = 0
    let galvaTotal = 0
    let costPerMil = 0

    if (selectedMaterial === 'OURO') {
      // Aqui a mão de obra é somada ao valor do ouro e multiplicada pelos milésimos
      costPerMil = (goldQuote || 0) + (platingLabor || 0)
      galvaPricePerKg = costPerMil * (milQuantity || 0)
      galvaTotal = weightInKg * galvaPricePerKg
    } else {
      const fixedPrices = { PRATA: silverKgPrice, RODIO: rhodiumKgPrice, VERNIZ: varnishKgPrice }
      galvaPricePerKg = fixedPrices[selectedMaterial as keyof typeof fixedPrices] || 0
      galvaTotal = weightInKg * galvaPricePerKg
    }

    // Cálculo Simples (Bruto/Folhado)
    const simpleTotal = purchaseItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0)

    return { costPerMil, galvaPricePerKg, galvaTotal, simpleTotal }
  }, [selectedMaterial, goldQuote, platingLabor, milQuantity, batchWeightG, silverKgPrice, rhodiumKgPrice, varnishKgPrice, purchaseItems])

  const handleFinish = async () => {
    if (!selectedSupplier) return
    setIsFinishingPurchase(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const isGalva = selectedSupplier.category === 'GALVANICA'
      const total = isGalva ? results.galvaTotal : results.simpleTotal
      const notes = isGalva 
        ? `LOTE: ${batchWeightG}G | MATERIAL: ${selectedMaterial} | CUSTO KG: R$ ${results.galvaPricePerKg}`
        : `PEDIDO: ${purchaseItems.length} ITENS`

      const { data: purchase, error } = await supabase.from('purchases').insert({ 
        user_id: user?.id, 
        supplier_id: selectedSupplier.id, 
        total_amount: total, 
        created_at: new Date(purchaseDate).toISOString(),
        notes: notes
      }).select().single()
      
      if (error) throw error

      if (!isGalva && purchase) {
        for (const item of purchaseItems) {
          await supabase.from('purchase_items').insert({
            purchase_id: purchase.id,
            name: item.name.toUpperCase(),
            quantity: item.quantity,
            unit_cost: item.unitCost
          })
        }
      }

      // GERAÇÃO DE PDF
      const doc = new jsPDF()
      doc.setFontSize(22); doc.setTextColor(74, 50, 46); doc.text('LAPIDADO ERP', 105, 20, { align: 'center' })
      doc.setFontSize(10); doc.setTextColor(201, 144, 144); doc.text(`REGISTRO DE CUSTOS - ${selectedSupplier.name}`, 105, 28, { align: 'center' })
      
      const tableHead = isGalva ? [['DESCRIÇÃO', 'VALOR']] : [['ITEM', 'QTD', 'UNIT', 'TOTAL']]
      const tableBody = isGalva ? [
        ['DATA DO PROCESSO', purchaseDate],
        ['MATERIAL SELECIONADO', selectedMaterial],
        ['PESO DO LOTE', `${batchWeightG} G`],
        ['VALOR POR KG', `R$ ${results.galvaPricePerKg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['TOTAL A PAGAR', `R$ ${results.galvaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ] : purchaseItems.map(i => [
        i.name.toUpperCase(),
        i.quantity.toString(),
        `R$ ${i.unitCost.toLocaleString('pt-BR')}`,
        `R$ ${(i.quantity * i.unitCost).toLocaleString('pt-BR')}`
      ])

      autoTable(doc, {
        startY: 40,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [74, 50, 46] }
      })

      if (!isGalva) {
        const finalY = (doc as any).lastAutoTable.finalY + 10
        doc.setFontSize(14); doc.text(`TOTAL: R$ ${results.simpleTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 190, finalY, { align: 'right' })
      }

      doc.save(`romaneio-${selectedSupplier.name.toLowerCase()}-${purchaseDate}.pdf`)
      setShowPurchaseModal(false); loadData()
      toast.success('Lançamento concluído e PDF gerado! 💎')
    } catch (err: any) { 
      alert('Erro ao salvar: ' + err.message) 
    } finally { 
      setIsFinishingPurchase(false) 
    }
  }

  async function handleSaveSupplier() {
    if (!name) return
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const data = { user_id: user?.id, name: name.toUpperCase(), category, phone, link, notes }
      
      if (editingSupplier) {
        const { error } = await supabase.from('suppliers').update(data).eq('id', editingSupplier.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('suppliers').insert(data)
        if (error) throw error
      }
      
      setShowAddModal(false)
      setEditingSupplier(null)
      setName('')
      loadData()
      toast.success('Fornecedor salvo com sucesso! 💎')
    } catch (err: any) { 
      toast.error('Erro ao salvar fornecedor: ' + err.message) 
    } finally { 
      setIsSaving(false) 
    }
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
        <button onClick={() => { setEditingSupplier(null); setName(''); setCategory('BRUTO'); setPhone(''); setLink(''); setNotes(''); setShowAddModal(true)}} className="bg-brand-primary text-white px-10 py-5 rounded-[30px] font-black text-xs uppercase flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"><Plus size={20}/> Novo Parceiro</button>
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
              <Calculator size={16}/> {s.category === 'GALVANICA' ? 'Calculadora de Galvanoplastia' : 'Lançar Pedido / Custos'}
            </button>
            
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => { setEditingSupplier(s); setName(s.name); setCategory(s.category); setPhone(s.phone || ''); setNotes(s.notes || ''); setShowAddModal(true) }} className="p-3 bg-white rounded-xl shadow-md text-brand-secondary hover:text-brand-primary transition-all"><Pencil size={18}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* 🚀 MODAL DINÂMICO (GALVANICA VS SIMPLES) */}
      {showPurchaseModal && selectedSupplier && (
        <div className="fixed inset-0 bg-brand-primary/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[50px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
            <div className="p-8 border-b border-brand-secondary/10 flex justify-between items-center bg-rose-50/20">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-brand-primary rounded-2xl text-white shadow-lg"><Calculator size={24}/></div>
                 <div>
                    <h3 className="text-2xl font-black text-brand-primary uppercase tracking-tighter">{selectedSupplier.category === 'GALVANICA' ? 'Calculadora TÉCNICA' : 'Lançamento de Pedido'}</h3>
                    <p className="text-[10px] font-bold text-brand-secondary/50 uppercase tracking-[0.2em]">{selectedSupplier.name}</p>
                 </div>
              </div>
              <button onClick={() => setShowPurchaseModal(false)} className="p-4 hover:bg-rose-100 rounded-full text-brand-primary transition-all"><X size={32}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              
              {/* --- MODO GALVANICA --- */}
              {selectedSupplier.category === 'GALVANICA' ? (
                <>
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins size={18} className="text-brand-primary"/>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-primary">1. Cotações e Mão de Obra</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="space-y-2 bg-amber-50/50 p-4 rounded-3xl border border-amber-100">
                        <label className="text-[8px] font-black uppercase text-amber-700 block ml-1">Cotação Ouro (g)</label>
                        <input type="number" value={goldQuote || ''} onChange={(e) => setGoldQuote(parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-amber-900 outline-none" placeholder="R$ 0,00"/>
                      </div>
                      <div className="space-y-2 bg-amber-50/50 p-4 rounded-3xl border border-amber-100">
                        <label className="text-[8px] font-black uppercase text-amber-700 block ml-1">M.O. / Milésimo</label>
                        <input type="number" value={platingLabor || ''} onChange={(e) => setPlatingLabor(parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-amber-900 outline-none" placeholder="R$ 0,00"/>
                      </div>
                      <div className="space-y-2 bg-rose-50/50 p-4 rounded-3xl border border-rose-100">
                        <label className="text-[8px] font-black uppercase text-brand-primary block ml-1">Preço KG (Prata)</label>
                        <input type="number" value={silverKgPrice || ''} onChange={(e) => setSilverKgPrice(parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-brand-primary outline-none" placeholder="R$ 0,00"/>
                      </div>
                      <div className="space-y-2 bg-rose-50/50 p-4 rounded-3xl border border-rose-100">
                        <label className="text-[8px] font-black uppercase text-brand-primary block ml-1">Preço KG (Ródio)</label>
                        <input type="number" value={rhodiumKgPrice || ''} onChange={(e) => setRhodiumKgPrice(parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-brand-primary outline-none" placeholder="R$ 0,00"/>
                      </div>
                      <div className="space-y-2 bg-rose-50/50 p-4 rounded-3xl border border-rose-100">
                        <label className="text-[8px] font-black uppercase text-brand-primary block ml-1">Preço KG (Verniz)</label>
                        <input type="number" value={varnishKgPrice || ''} onChange={(e) => setVarnishKgPrice(parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-brand-primary outline-none" placeholder="R$ 0,00"/>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers size={18} className="text-brand-primary"/>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-primary">2. Especificações do Lote</h4>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-brand-secondary/40 ml-2">Peso do Lote (Gramas)</label>
                          <input type="number" value={batchWeightG || ''} onChange={(e) => setBatchWeightG(parseFloat(e.target.value) || 0)} className="w-full px-6 py-5 rounded-2xl bg-brand-secondary/5 text-sm font-black outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="EX: 500"/>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-brand-secondary/40 ml-2">Material</label>
                          <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value as any)} className="w-full px-6 py-5 rounded-2xl bg-brand-secondary/5 text-sm font-black outline-none appearance-none">
                            <option value="OURO">BANHO DE OURO</option>
                            <option value="PRATA">BANHO DE PRATA</option>
                            <option value="RODIO">BANHO DE RÓDIO</option>
                            <option value="VERNIZ">VERNIZ/PROTEÇÃO</option>
                          </select>
                      </div>
                      {selectedMaterial === 'OURO' && (
                        <div className="space-y-2 animate-in slide-in-from-right duration-300">
                            <label className="text-[9px] font-black uppercase text-amber-700 ml-2">Milésimos</label>
                            <input type="number" value={milQuantity || ''} onChange={(e) => setMilQuantity(parseFloat(e.target.value) || 0)} className="w-full px-6 py-5 rounded-2xl bg-amber-50 border border-amber-100 text-sm font-black text-amber-900 outline-none" placeholder="EX: 10"/>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* --- MODO SIMPLES (BRUTO / FOLHADO) --- */
                <div className="space-y-6">
                   <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={18} className="text-brand-primary"/>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-primary">Itens do Pedido / Carga</h4>
                      </div>
                      
                      {/* 📷 BOTÃO DE IA */}
                      <div>
                        <input type="file" accept="image/*" capture="environment" className="hidden" id="ai-romaneio-upload" onChange={handleScanRomaneio} disabled={isAnalyzing}/>
                        <label htmlFor="ai-romaneio-upload" className={`flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isAnalyzing ? <Loader2 className="animate-spin" size={14}/> : <Camera size={14}/>}
                          {isAnalyzing ? 'Analisando...' : 'Ler Romaneio com IA'}
                        </label>
                      </div>
                   </div>
                   <div className="space-y-4">
                      {purchaseItems.map((item, index) => (
                        <div key={index} className="bg-white p-6 rounded-[30px] border border-brand-secondary/5 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end group relative">
                           <div className="md:col-span-6 space-y-1">
                              <label className="text-[8px] font-black uppercase text-brand-secondary/40 ml-2">Escolher Joia Cadastrada</label>
                              <select 
                                value={item.product_id || ''} 
                                onChange={(e) => handleSelectProduct(index, e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-brand-primary/20"
                              >
                                <option value="">SELECIONE UMA JOIA...</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                                <option value="manual">-- DIGITAR MANUALMENTE --</option>
                              </select>
                              {item.product_id === 'manual' && (
                                <input 
                                  type="text" 
                                  value={item.name} 
                                  onChange={(e) => { const newItems = [...purchaseItems]; newItems[index].name = e.target.value.toUpperCase(); setPurchaseItems(newItems)}} 
                                  className="w-full mt-2 px-5 py-3 rounded-xl bg-white border border-brand-secondary/10 text-[10px] font-bold uppercase" 
                                  placeholder="NOME DA PEÇA"
                                />
                              )}
                           </div>
                           <div className="md:col-span-2 space-y-1">
                              <label className="text-[8px] font-black uppercase text-brand-secondary/40 ml-2">Quantidade</label>
                              <input type="number" value={item.quantity || ''} onChange={(e) => { const newItems = [...purchaseItems]; newItems[index].quantity = parseInt(e.target.value) || 0; setPurchaseItems(newItems)}} className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-xs font-black text-center outline-none"/>
                           </div>
                           <div className="md:col-span-3 space-y-1">
                              <label className="text-[8px] font-black uppercase text-brand-secondary/40 ml-2">Custo Unitário (R$)</label>
                              <input type="number" value={item.unitCost || ''} onChange={(e) => { const newItems = [...purchaseItems]; newItems[index].unitCost = parseFloat(e.target.value) || 0; setPurchaseItems(newItems)}} className="w-full px-5 py-4 rounded-2xl bg-brand-secondary/5 text-xs font-black outline-none" placeholder="R$ 0,00"/>
                           </div>
                           <button onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== index))} className="absolute -top-3 -right-3 p-3 bg-rose-50 text-rose-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                        </div>
                      ))}
                      <button onClick={() => setPurchaseItems([...purchaseItems, { name: '', quantity: 1, unitCost: 0 }])} className="w-full py-4 border-2 border-dashed border-brand-secondary/10 rounded-2xl text-[10px] font-black uppercase text-brand-secondary/40 hover:bg-brand-secondary/5 transition-all flex items-center justify-center gap-2"><Plus size={16}/> Adicionar Item</button>
                   </div>
                </div>
              )}

              {/* 3. SEÇÃO DE RESULTADOS (RESUMO FINAL) */}
              <div className="space-y-6">
                <div className="bg-brand-primary p-10 rounded-[50px] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700"><Receipt size={120}/></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    {selectedSupplier.category === 'GALVANICA' ? (
                      <>
                        {selectedMaterial === 'OURO' && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Custo de 1 Milésimo</p>
                            <p className="text-2xl font-black">R$ {results.costPerMil.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Valor por KG ({selectedMaterial})</p>
                          <p className="text-2xl font-black">R$ {results.galvaPricePerKg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="space-y-1 bg-white/10 p-6 rounded-[35px] backdrop-blur-md">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 mb-2">Total a Pagar</p>
                          <p className="text-4xl font-black tracking-tighter">R$ {results.galvaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total de Itens</p>
                           <p className="text-2xl font-black">{purchaseItems.reduce((acc, i) => acc + (i.quantity || 0), 0)} un</p>
                        </div>
                        <div className="col-span-2 space-y-1 bg-white/10 p-6 rounded-[35px] backdrop-blur-md">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 mb-2">Total do Pedido</p>
                           <p className="text-4xl font-black tracking-tighter">R$ {results.simpleTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-brand-secondary/10 bg-white flex justify-between items-center">
              <div className="flex items-center gap-4 text-brand-secondary/40">
                <Calendar size={20}/>
                <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="bg-transparent text-xs font-black outline-none uppercase"/>
              </div>
              <button onClick={handleFinish} disabled={isFinishingPurchase || (selectedSupplier.category === 'GALVANICA' ? results.galvaTotal <= 0 : results.simpleTotal <= 0)} className="bg-brand-primary text-white px-16 py-6 rounded-[30px] font-black text-sm uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50">
                {isFinishingPurchase ? <Loader2 className="animate-spin" size={24}/> : <><Check size={24}/> FINALIZAR LANÇAMENTO & PDF</>}
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
