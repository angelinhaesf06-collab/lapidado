'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Percent, TrendingUp, Gem, Calculator, FileText, Plus, X, Layers, ShoppingBag, Trash2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function PricingPage() {
  const [loading, setLoading] = useState(true)
  const [rules, setPricingRules] = useState({ globalMarkup: 100 })
  
  // 1. ESTADO DA CALCULADORA (Entrada Única)
  const [currentEntry, setCurrentEntry] = useState({
    name: '',
    material: 'OURO',
    rawVal: 0,
    weightG: 0,
    mils: 0,
    goldPrice: 400,
    labor: 0,
    vernizKgPrice: 0,
    others: 0,
    markup: 100
  })

  // 2. ESTADO DA LISTA (O que já foi calculado)
  const [addedItems, setAddedItems] = useState<any[]>([])

  const supabase = createClient()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: brandingData } = await supabase.from('branding').select('notes').eq('user_id', user.id).maybeSingle()
      if (brandingData?.notes && brandingData.notes.includes('PRICING_RULES:')) {
        const jsonStr = brandingData.notes.split('PRICING_RULES:')[1]
        try {
          const loadedRules = JSON.parse(jsonStr)
          setPricingRules({ globalMarkup: loadedRules.globalMarkup || 100 })
          setCurrentEntry(prev => ({ ...prev, markup: loadedRules.globalMarkup || 100 }))
        } catch (e) { console.error(e) }
      }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // 💎 NEXUS: Função de Cálculo mestre
  const calculateData = (item: any) => {
    if (item.material === 'FOLHADO') {
      const totalCost = (Number(item.rawVal) || 0) + (Number(item.others) || 0)
      const salePrice = totalCost * (Number(item.markup) / 100 + 1)
      return { platingCost: 0, vernizCost: 0, totalCost, salePrice }
    }

    const weightInKg = (Number(item.weightG) || 0) / 1000
    let platingCost = 0
    let vernizCost = 0

    if (item.material === 'OURO') {
      const costPerMil = (Number(item.goldPrice) || 0) + (Number(item.labor) || 0)
      platingCost = (Number(item.mils) || 0) * costPerMil * weightInKg
    } else {
      platingCost = (Number(item.goldPrice) || 0) * weightInKg
    }

    if ((item.material === 'OURO' || item.material === 'PRATA') && item.vernizKgPrice > 0) {
      vernizCost = (Number(item.vernizKgPrice) || 0) * weightInKg
    }

    const totalCost = (Number(item.rawVal) || 0) + (Number(item.others) || 0) + platingCost + vernizCost
    const salePrice = totalCost * (Number(item.markup) / 100 + 1)
    
    return { platingCost, vernizCost, totalCost, salePrice }
  }

  const handleAddItem = () => {
    if (!currentEntry.name) return toast.error('Dê um nome para a peça! 💎')
    const res = calculateData(currentEntry)
    setAddedItems([...addedItems, { ...currentEntry, ...res, id: Date.now() }])
    
    // Limpa apenas o necessário para a próxima entrada
    setCurrentEntry(prev => ({
      ...prev,
      name: '',
      rawVal: 0,
      weightG: 0,
      others: 0
    }))
    toast.success('Peça adicionada ao romaneio! ✨')
  }

  const generateReportPDF = () => {
    if (addedItems.length === 0) return toast.error('Adicione itens primeiro! 📸')
    const doc = new jsPDF()
    doc.setFontSize(22); doc.setTextColor(74, 50, 46); doc.text('LAPIDADO ERP', 105, 20, { align: 'center' })
    doc.setFontSize(10); doc.setTextColor(201, 144, 144); doc.text('ROMANEIO INDUSTRIAL DE CARGA', 105, 28, { align: 'center' })
    
    const tableBody = addedItems.map(item => [
      item.name.toUpperCase(),
      item.material,
      item.material === 'FOLHADO' ? '---' : `${item.weightG.toFixed(2)}g`,
      `R$ ${item.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `R$ ${item.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ])

    autoTable(doc, {
      startY: 40,
      head: [['PEÇA', 'TIPO', 'PESO', 'CUSTO TOTAL', 'PREÇO VENDA']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [74, 50, 46] }
    })

    doc.save(`romaneio-${new Date().toLocaleDateString()}.pdf`)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>

  const activeRes = calculateData(currentEntry)
  const isFolhado = currentEntry.material === 'FOLHADO'

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black uppercase text-brand-primary tracking-tighter">Estação de Precificação</h2>
          <p className="text-brand-secondary text-[10px] md:text-[12px] font-black tracking-[0.4em] uppercase mt-2">Engenharia de Custo Industrial 💎</p>
        </div>
        <button onClick={generateReportPDF} className="bg-brand-primary text-white px-8 py-5 rounded-[25px] font-black text-[10px] uppercase flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] transition-all">
           <FileText size={18}/> Exportar Romaneio PDF ({addedItems.length})
        </button>
      </div>

      {/* 🚀 CALCULADORA FIXA NO TOPO */}
      <div className="bg-white rounded-[45px] border-2 border-brand-primary/10 shadow-2xl overflow-hidden mb-12">
        <div className="bg-brand-primary/5 p-6 border-b border-brand-primary/10 flex flex-col md:flex-row gap-4 items-center">
            <select 
              value={currentEntry.material} 
              onChange={(e) => setCurrentEntry({...currentEntry, material: e.target.value})}
              className="bg-brand-primary text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase outline-none shadow-lg w-full md:w-auto"
            >
              <option value="OURO">BANHO OURO</option>
              <option value="PRATA">BANHO PRATA</option>
              <option value="RODIO">BANHO RÓDIO</option>
              <option value="FOLHADO">FOLHADO PRONTO</option>
            </select>
            <input 
              type="text" 
              value={currentEntry.name} 
              onChange={e => setCurrentEntry({...currentEntry, name: e.target.value.toUpperCase()})}
              className="flex-1 w-full bg-white border border-brand-primary/20 px-8 py-4 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all" 
              placeholder="DIGITE O NOME OU REFERÊNCIA DA PEÇA..."/>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          
          {/* BLOCO 1: BANHO */}
          {!isFolhado ? (
            <div className="space-y-4 bg-amber-50/30 p-6 rounded-[35px] border border-amber-100">
               <div className="flex items-center gap-2 text-amber-700 mb-2"><Layers size={16}/><h4 className="text-[9px] font-black uppercase tracking-widest">Banho Técnico</h4></div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-amber-800/40 uppercase ml-1">Peso (g)</label>
                    <input type="number" value={currentEntry.weightG || ''} onChange={e => setCurrentEntry({...currentEntry, weightG: parseFloat(e.target.value) || 0})} className="w-full p-3 rounded-xl bg-white border border-amber-200 font-black text-xs outline-none" placeholder="0.00"/>
                  </div>
                  {currentEntry.material === 'OURO' && (
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-amber-800/40 uppercase ml-1">Milésimos</label>
                      <input type="number" value={currentEntry.mils || ''} onChange={e => setCurrentEntry({...currentEntry, mils: parseFloat(e.target.value) || 0})} className="w-full p-3 rounded-xl bg-white border border-amber-200 font-black text-xs outline-none" placeholder="10"/>
                    </div>
                  )}
               </div>
               <div className="space-y-1">
                  <label className="text-[7px] font-black text-amber-800/40 uppercase ml-1">{currentEntry.material === 'OURO' ? 'Cotação Ouro (g)' : `Preço KG ${currentEntry.material}`}</label>
                  <input type="number" value={currentEntry.goldPrice || ''} onChange={e => setCurrentEntry({...currentEntry, goldPrice: parseFloat(e.target.value) || 0})} className="w-full p-3 rounded-xl bg-white border border-amber-200 font-black text-xs outline-none" placeholder="400.00"/>
               </div>
               {currentEntry.material === 'OURO' && (
                 <div className="space-y-1">
                    <label className="text-[7px] font-black text-amber-800/40 uppercase ml-1">M.O. p/ Milésimo</label>
                    <input type="number" value={currentEntry.labor || ''} onChange={e => setCurrentEntry({...currentEntry, labor: parseFloat(e.target.value) || 0})} className="w-full p-3 rounded-xl bg-white border border-amber-200 font-black text-xs outline-none" placeholder="10.00"/>
                 </div>
               )}
            </div>
          ) : (
            <div className="bg-brand-primary/5 p-6 rounded-[35px] border-2 border-dashed border-brand-primary/20 flex flex-col items-center justify-center text-center min-h-[200px]">
               <ShoppingBag size={32} className="text-brand-primary/30 mb-2"/>
               <p className="text-[10px] font-black text-brand-primary uppercase">Cálculo de Peça Pronta</p>
            </div>
          )}

          {/* BLOCO 2: CUSTOS PEÇA */}
          <div className="space-y-4 bg-rose-50/30 p-6 rounded-[35px] border border-rose-100">
             <div className="flex items-center gap-2 text-rose-700 mb-2"><ShoppingBag size={16}/><h4 className="text-[9px] font-black uppercase tracking-widest">Valores de Base</h4></div>
             <div className="space-y-1">
                <label className="text-[7px] font-black text-rose-800/40 uppercase ml-1">{isFolhado ? 'Preço de Compra' : 'Valor Bruto'}</label>
                <input type="number" value={currentEntry.rawVal || ''} onChange={e => setCurrentEntry({...currentEntry, rawVal: parseFloat(e.target.value) || 0})} className="w-full p-4 rounded-xl bg-white border border-rose-200 font-black text-sm outline-none" placeholder="0.00"/>
             </div>
             <div className="space-y-1">
                <label className="text-[7px] font-black text-rose-800/40 uppercase ml-1">Outros (Tags/Pedras)</label>
                <input type="number" value={currentEntry.others || ''} onChange={e => setCurrentEntry({...currentEntry, others: parseFloat(e.target.value) || 0})} className="w-full p-3 rounded-xl bg-white border border-rose-200 font-black text-xs outline-none" placeholder="0.00"/>
             </div>
             {!isFolhado && (currentEntry.material === 'OURO' || currentEntry.material === 'PRATA') && (
               <div className="space-y-1 pt-2">
                  <label className="text-[7px] font-black text-green-700 uppercase ml-1">Verniz (KG)</label>
                  <input type="number" value={currentEntry.vernizKgPrice || ''} onChange={e => setCurrentEntry({...currentEntry, vernizKgPrice: parseFloat(e.target.value) || 0})} className="w-full p-3 rounded-xl bg-green-50 border border-green-200 font-black text-xs text-green-800 outline-none" placeholder="R$ 0.00"/>
               </div>
             )}
          </div>

          {/* BLOCO 3: MARGEM */}
          <div className="space-y-4 bg-brand-primary p-6 rounded-[35px] text-white shadow-xl">
             <div className="flex items-center gap-2 mb-2 opacity-60"><Percent size={16}/><h4 className="text-[9px] font-black uppercase tracking-widest">Lucratividade</h4></div>
             <div className="space-y-1">
                <label className="text-[7px] font-black uppercase opacity-40 ml-1">Markup (%)</label>
                <input type="number" value={currentEntry.markup || ''} onChange={e => setCurrentEntry({...currentEntry, markup: parseFloat(e.target.value) || 0})} className="w-full p-4 rounded-xl bg-white/10 border border-white/20 font-black text-xl text-amber-200 outline-none"/>
             </div>
             <div className="pt-4 border-t border-white/10">
                <p className="text-[7px] font-black uppercase opacity-40">Custo Total</p>
                <p className="text-xl font-black">R$ {activeRes.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
             </div>
          </div>

          {/* BLOCO 4: RESULTADO & ADICIONAR */}
          <div className="h-full flex flex-col gap-4">
             <div className="flex-1 bg-amber-400 p-6 rounded-[35px] text-brand-primary flex flex-col justify-center items-center text-center shadow-xl">
                <p className="text-[8px] font-black uppercase opacity-60 mb-1">Preço Sugerido</p>
                <p className="text-3xl font-black tracking-tighter">R$ {activeRes.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
             </div>
             <button onClick={handleAddItem} className="w-full py-5 rounded-[25px] bg-brand-primary text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-secondary transition-all shadow-2xl">
                <Plus size={20}/> Adicionar à Lista
             </button>
          </div>

        </div>
      </div>

      {/* 📜 LISTAGEM SIMPLES (ROMANEIO) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <CheckCircle2 size={24} className="text-brand-primary"/>
          <h3 className="text-sm font-black uppercase text-brand-primary tracking-widest">Itens no Romaneio ({addedItems.length})</h3>
        </div>

        <div className="bg-white rounded-[40px] border border-brand-secondary/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-secondary/5 border-b border-brand-secondary/10">
                  <th className="p-6 text-[8px] font-black uppercase text-brand-secondary/40 tracking-[0.2em]">Joia / Identificação</th>
                  <th className="p-6 text-[8px] font-black uppercase text-brand-secondary/40 tracking-[0.2em]">Tipo / Processo</th>
                  <th className="p-6 text-[8px] font-black uppercase text-brand-secondary/40 tracking-[0.2em]">Peso/Mils</th>
                  <th className="p-6 text-[8px] font-black uppercase text-brand-secondary/40 tracking-[0.2em]">Custo Total</th>
                  <th className="p-6 text-[8px] font-black uppercase text-brand-secondary/40 tracking-[0.2em]">Preço Venda</th>
                  <th className="p-6 text-[8px] font-black uppercase text-brand-secondary/40 tracking-[0.2em] text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-secondary/5">
                {addedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-brand-secondary/5 transition-all group">
                    <td className="p-6">
                      <p className="text-xs font-black text-brand-primary uppercase">{item.name}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${item.material === 'OURO' ? 'bg-amber-100 text-amber-700' : item.material === 'FOLHADO' ? 'bg-rose-100 text-rose-700' : 'bg-brand-secondary/10 text-brand-primary'}`}>{item.material}</span>
                    </td>
                    <td className="p-6">
                      <p className="text-[10px] font-bold text-brand-secondary">
                        {item.material === 'FOLHADO' ? 'PRONTA' : `${item.weightG}g / ${item.mils} mils`}
                      </p>
                    </td>
                    <td className="p-6">
                      <p className="text-[10px] font-black text-brand-primary">R$ {item.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-[10px] font-black text-brand-primary">R$ {item.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="p-6 text-center">
                       <button onClick={() => setAddedItems(addedItems.filter(i => i.id !== item.id))} className="p-3 text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16}/>
                       </button>
                    </td>
                  </tr>
                ))}
                {addedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                       <Calculator size={40} className="mx-auto mb-4 opacity-10 text-brand-primary"/>
                       <p className="text-[9px] font-black uppercase text-brand-secondary/30 tracking-widest">Nenhuma peça adicionada ao romaneio ainda.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
