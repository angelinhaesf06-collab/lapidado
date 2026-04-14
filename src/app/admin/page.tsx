'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, PlusCircle, Gem, Loader2, DollarSign, Pencil } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboard() {
  const [stats, setStats] = useState<{name: string, count: number}[]>([])
  const [finance, setFinance] = useState({ totalCost: 0, totalSales: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)
      
      const { data: categories } = await supabase.from('categories').select('id, name')
      const { data: products } = await supabase.from('products').select('category_id, price, cost_price, stock_quantity, description')

      if (categories && products) {
        // Estatísticas de Quantidade (Total de Itens Físicos)
        const totalItemsCount = products.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0)
        
        const counts = categories.map(cat => ({
          name: cat.name.toUpperCase(),
          count: products.filter(p => p.category_id === cat.id).reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0)
        }))
        
        const totalCountStat = { name: 'TOTAL DE PEÇAS', count: totalItemsCount }
        setStats([totalCountStat, ...counts])

        // Estatísticas Financeiras Reais (Preço x Quantidade)
        const totalCost = products.reduce((acc, p) => {
          let cost = Number(p.cost_price) || 0
          if (cost === 0 && p.description?.includes('DATA:{')) {
            try {
              const match = p.description.match(/DATA:({.*})/)
              if (match) cost = JSON.parse(match[1]).cost || 0
            } catch {}
          }
          return acc + (cost * (Number(p.stock_quantity) || 0))
        }, 0)
        
        const totalSales = products.reduce((acc, p) => acc + ((Number(p.price) || 0) * (Number(p.stock_quantity) || 0)), 0)
        setFinance({ totalCost, totalSales })
      }
      setLoading(false)
    }
    loadDashboardData()
  }, [supabase])

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-16">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-[#c99090] mx-auto lg:mx-0 mb-6 shadow-inner">
          <Gem size={32} />
        </div>
        <h2 className="text-4xl font-bold tracking-tight uppercase text-[#4a322e] mb-4 text-center lg:text-left">Olá, Empresária</h2>
        <p className="text-[#c99090] text-[10px] font-black tracking-[0.4em] uppercase text-center lg:text-left italic">O brilho do seu negócio começa aqui. 💎</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventário */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[60px] border border-rose-50 shadow-sm relative overflow-hidden">
          <h3 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <ShoppingBag size={14} /> Inventário por Categoria
          </h3>
          {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#c99090]" size={24} /></div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className={`p-5 rounded-[32px] relative group ${i === 0 ? 'bg-[#4a322e] text-white shadow-lg' : 'bg-rose-50/30 text-[#4a322e] hover:bg-rose-50/50'} transition-all`}>
                  <p className={`text-[7px] font-black uppercase tracking-widest mb-1 ${i === 0 ? 'text-rose-200' : 'text-[#c99090]'}`}>{stat.name}</p>
                  <h4 className="text-xl font-bold">{stat.count} <span className="text-[9px] font-light">PÇS</span></h4>
                  
                  <Link 
                    href={i === 0 ? "/admin/products" : `/admin/categories`}
                    className={`absolute top-4 right-4 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${i === 0 ? 'bg-white/10 text-rose-200 hover:bg-white/20' : 'bg-[#4a322e]/5 text-[#4a322e] hover:bg-[#4a322e]/10'}`}
                  >
                    <Pencil size={10} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo Financeiro */}
        <div className="bg-white p-10 rounded-[60px] border border-rose-50 shadow-sm flex flex-col justify-between">
          <h3 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <DollarSign size={14} /> Valor do Estoque
          </h3>
          <div className="space-y-6">
            <div className="p-6 rounded-[32px] bg-amber-50/50 border border-amber-100/50">
              <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest mb-1">Valor do Estoque (Custo)</p>
              <h4 className="text-2xl font-bold text-amber-900">R$ {finance.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
            </div>
            <div className="p-6 rounded-[32px] bg-green-50/50 border border-green-100/50">
              <p className="text-[8px] font-black text-green-700 uppercase tracking-widest mb-1">Valor do Estoque (Venda)</p>
              <h4 className="text-2xl font-bold text-green-900">R$ {finance.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
            </div>
          </div>
          <div className="mt-8 p-4 bg-[#4a322e] rounded-3xl text-center shadow-lg">
             <p className="text-[8px] font-black text-rose-200 uppercase tracking-widest mb-1">Lucro Estimado</p>
             <h4 className="text-xl font-bold text-white">R$ {(finance.totalSales - finance.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>

        {/* Ações Rápidas - Centralizada */}
        <div className="lg:col-span-3 flex justify-center mt-8">
          <Link href="/admin/products/new" className="w-full max-w-2xl bg-[#4a322e] p-10 rounded-[60px] text-white flex items-center justify-between group hover:bg-[#c99090] transition-all shadow-2xl">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform text-white">
                <PlusCircle size={36} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-[0.2em]">Cadastrar Nova Joia</h3>
                <p className="text-[10px] text-rose-200 font-bold uppercase tracking-[0.3em] mt-1">Clique para adicionar brilho ao seu catálogo</p>
              </div>
            </div>
            <Gem className="text-rose-200 group-hover:rotate-12 transition-transform" size={28} />
          </Link>
        </div>
      </div>
    </div>
  )
}
