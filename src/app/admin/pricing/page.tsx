'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Percent, TrendingUp, Info, Gem, Calculator, FileText } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PricingRules {
  globalMarkup: number
}

export default function PricingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rules, setPricingRules] = useState<PricingRules>({
    globalMarkup: 100
  })

  // ESTADOS DA CALCULADORA MANUAL
  const [calcData, setCalcData] = useState({
    name: '',
    rawVal: 0,
    weightG: 0,
    platingG: 0,
    others: 0,
    markup: 100
  })

  const supabase = createClient()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Carregar regras de precificação da tabela branding (campo notes)
      const { data: brandingData } = await supabase
        .from('branding')
        .select('notes')
        .eq('user_id', user.id)
        .maybeSingle()

      if (brandingData?.notes && brandingData.notes.includes('PRICING_RULES:')) {
        const jsonStr = brandingData.notes.split('PRICING_RULES:')[1]
        try {
          const loadedRules = JSON.parse(jsonStr)
          setPricingRules({ globalMarkup: loadedRules.globalMarkup || 100 })
        } catch (e) {
          console.error('Erro ao converter regras de precificação:', e)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      toast.error('Erro ao carregar configurações.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: currentBranding } = await supabase
        .from('branding')
        .select('notes')
        .eq('user_id', user.id)
        .maybeSingle()

      let baseNotes = currentBranding?.notes || ''
      if (baseNotes.includes('PRICING_RULES:')) {
        baseNotes = baseNotes.split('PRICING_RULES:')[0]
      }

      const updatedNotes = `${baseNotes}PRICING_RULES:${JSON.stringify(rules)}`

      const { error } = await supabase
        .from('branding')
        .update({ notes: updatedNotes })
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Markup global salvo! 💎')
    } catch (err: unknown) {
      const error = err as Error
      toast.error('Erro ao salvar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateCalc = (field: string, val: any) => {
    setCalcData(prev => ({ ...prev, [field]: val }))
  }

  const manualResults = useMemo(() => {
    const platingCost = (calcData.weightG || 0) * (calcData.platingG || 0)
    const totalCost = (calcData.rawVal || 0) + platingCost + (calcData.others || 0)
    const salePrice = totalCost * (calcData.markup / 100 + 1)
    return { platingCost, totalCost, salePrice }
  }, [calcData])

  const generateReportPDF = () => {
    const doc = new jsPDF()
    const brandColor = [74, 50, 46] // Marrom Lapidado
    const secondaryColor = [201, 144, 144] // Creme/Rosa

    doc.setFontSize(22); doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]); doc.text('LAPIDADO ERP', 105, 20, { align: 'center' })
    doc.setFontSize(10); doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]); doc.text('RELATÓRIO TÉCNICO DE PRECIFICAÇÃO', 105, 28, { align: 'center' })
    
    autoTable(doc, {
      startY: 40,
      head: [['DESCRIÇÃO DO CAMPO', 'VALOR DETALHADO']],
      body: [
        ['PEÇA / CÓDIGO', calcData.name.toUpperCase() || 'NÃO INFORMADO'],
        ['VALOR BRUTO (PEÇA)', `R$ ${calcData.rawVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['PESO DA PEÇA', `${calcData.weightG} G`],
        ['VALOR GRAMA (BANHO)', `R$ ${calcData.platingG.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['CUSTO TOTAL DO BANHO', `R$ ${manualResults.platingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['OUTROS GASTOS (EXTRAS)', `R$ ${calcData.others.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['MARKUP APLICADO', `${calcData.markup}%`],
        ['---', '---'],
        ['CUSTO TOTAL FINAL', `R$ ${manualResults.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['PREÇO DE VENDA SUGERIDO', `R$ ${manualResults.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: brandColor },
      styles: { fontSize: 10, cellPadding: 5 }
    })

    const finalName = calcData.name.toLowerCase() || 'avulsa'
    doc.save(`precificacao-${finalName}.pdf`)
    toast.success('Relatório de precificação gerado! 💎')
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black uppercase text-brand-primary tracking-tighter">Precificação Inteligente</h2>
          <p className="text-brand-secondary text-[12px] font-black tracking-[0.4em] uppercase mt-2">Gestão de Margens & Lucratividade 💎</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-brand-primary text-white px-10 py-5 rounded-[30px] font-black text-xs uppercase flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> Salvar Configurações</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* CARD MARKUP GLOBAL */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm space-y-6 h-full text-center">
            <div className="flex items-center justify-center gap-3 text-brand-primary">
              <TrendingUp size={24} />
              <h3 className="text-sm font-black uppercase tracking-widest">Markup Global da Marca</h3>
            </div>
            <div className="p-10 rounded-[35px] bg-brand-primary text-white space-y-4 shadow-xl shadow-brand-primary/20">
              <label className="text-[10px] font-black uppercase opacity-60 tracking-widest">Margem Padrão de Venda</label>
              <div className="flex items-center justify-center gap-3">
                <input 
                  type="number" 
                  value={rules.globalMarkup} 
                  onChange={(e) => setPricingRules({globalMarkup: parseFloat(e.target.value) || 0})}
                  className="bg-transparent text-6xl font-black outline-none w-32 border-b-4 border-white/20 focus:border-white transition-all text-center"
                />
                <Percent size={40} />
              </div>
              <p className="text-[10px] font-medium leading-relaxed opacity-80 pt-4">
                Este multiplicador será aplicado automaticamente em todas as novas joias cadastradas no sistema.
              </p>
            </div>
          </div>
        </div>

        {/* INFO CARD */}
        <div className="flex flex-col justify-center gap-6">
          <div className="bg-amber-50 p-8 rounded-[40px] border border-amber-100 flex gap-5">
             <div className="p-4 bg-white rounded-2xl shadow-sm text-amber-600 h-fit">
                <Info size={24} />
             </div>
             <div>
                <h4 className="text-sm font-black text-amber-900 uppercase mb-2">Entendendo o Markup</h4>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                   O Markup é o multiplicador que você usa sobre o custo total da peça para chegar ao preço final. <br/><br/>
                   • 100%: Preço de venda é o dobro do custo. <br/>
                   • 150%: Preço de venda é o custo + 150% de lucro.
                </p>
             </div>
          </div>
          <div className="bg-rose-50/50 p-8 rounded-[40px] border border-rose-100 flex gap-5">
             <div className="p-4 bg-white rounded-2xl shadow-sm text-brand-primary h-fit">
                <Gem size={24} />
             </div>
             <div>
                <h4 className="text-sm font-black text-brand-primary uppercase mb-2">Engenharia Financeira</h4>
                <p className="text-[11px] text-brand-secondary font-medium leading-relaxed">
                   Abaixo você encontra a calculadora técnica para precificar lotes ou peças avulsas com detalhamento de banho e peso.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* 🚀 CALCULADORA MANUAL DE PRECIFICAÇÃO (NOVA ESTRUTURA) */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary rounded-2xl text-white shadow-lg"><Calculator size={24}/></div>
          <div>
            <h3 className="text-2xl font-black text-brand-primary uppercase tracking-tighter">Calculadora Manual de Precificação</h3>
            <p className="text-[10px] font-bold text-brand-secondary/50 uppercase tracking-[0.2em]">Cálculo técnico para peças avulsas ou novos lotes</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[50px] border border-brand-secondary/10 shadow-xl space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
             <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black uppercase text-brand-secondary/40 ml-2">Nome ou Código da Peça</label>
                <input type="text" value={calcData.name} onChange={e => updateCalc('name', e.target.value)} className="w-full px-6 py-5 rounded-2xl bg-brand-secondary/5 text-sm font-black uppercase outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="EX: ANEL SOLITÁRIO"/>
             </div>
             <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-brand-secondary/40 ml-2">Valor Bruto (R$)</label>
                <input type="number" value={calcData.rawVal || ''} onChange={e => updateCalc('rawVal', parseFloat(e.target.value) || 0)} className="w-full px-6 py-5 rounded-2xl bg-brand-secondary/5 text-sm font-black outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="0,00"/>
             </div>
             <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-brand-secondary/40 ml-2">Peso Peça (G)</label>
                <input type="number" value={calcData.weightG || ''} onChange={e => updateCalc('weightG', parseFloat(e.target.value) || 0)} className="w-full px-6 py-5 rounded-2xl bg-brand-secondary/5 text-sm font-black outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="0.00"/>
             </div>
             <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-brand-secondary/40 ml-2">Valor Grama Banho</label>
                <input type="number" value={calcData.platingG || ''} onChange={e => updateCalc('platingG', parseFloat(e.target.value) || 0)} className="w-full px-6 py-5 rounded-2xl bg-amber-50 border border-amber-100 text-sm font-black text-amber-900 outline-none" placeholder="0,00"/>
             </div>
             <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-brand-secondary/40 ml-2">Outros Gastos</label>
                <input type="number" value={calcData.others || ''} onChange={e => updateCalc('others', parseFloat(e.target.value) || 0)} className="w-full px-6 py-5 rounded-2xl bg-brand-secondary/5 text-sm font-black outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="Tags/Pedras"/>
             </div>
          </div>

          <div className="pt-8 border-t border-brand-secondary/5 flex flex-col md:flex-row items-center gap-10">
             
             <div className="flex-1 space-y-6 w-full">
                <div className="bg-brand-secondary/5 p-6 rounded-3xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Percent className="text-brand-primary" size={20}/>
                      <span className="text-xs font-black uppercase text-brand-primary">Margem de Lucro (Markup %)</span>
                   </div>
                   <input type="number" value={calcData.markup} onChange={e => updateCalc('markup', parseFloat(e.target.value) || 0)} className="bg-white px-6 py-3 rounded-xl border border-brand-secondary/10 text-lg font-black text-brand-primary w-32 text-center outline-none focus:ring-2 focus:ring-brand-primary/20"/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-6 rounded-3xl border border-brand-secondary/10 text-center">
                      <p className="text-[9px] font-black uppercase text-brand-secondary/40 mb-1">Custo Total</p>
                      <p className="text-xl font-black text-brand-primary">R$ {manualResults.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                   </div>
                   <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-center">
                      <p className="text-[9px] font-black uppercase text-amber-600/60 mb-1">Custo do Banho</p>
                      <p className="text-xl font-black text-amber-700">R$ {manualResults.platingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                   </div>
                </div>
             </div>

             <div className="w-full md:w-[400px] bg-brand-primary p-10 rounded-[50px] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700"><Gem size={100}/></div>
                <div className="relative z-10 space-y-6">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Preço Sugerido Venda</p>
                      <p className="text-5xl font-black tracking-tighter">R$ {manualResults.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                   </div>
                   <button onClick={generateReportPDF} className="w-full py-5 bg-white text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-amber-50 transition-all">
                      <FileText size={18}/> Gerar Relatório PDF
                   </button>
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  )
}

