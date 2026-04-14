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
      try {
        const { data: categories } = await supabase.from('categories').select('id, name')
        const { data: products } = await supabase.from('products').select('category_id, price, cost_price, stock_quantity, description')

        if (categories && products) {
          const totalItemsCount = products.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0)
          const counts = categories.map(cat => ({
            name: cat.name.toUpperCase(),
            count: products.filter(p => p.category_id === cat.id).reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0)
          }))
          setStats([{ name: 'TOTAL DE PEÇAS', count: totalItemsCount }, ...counts])

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
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [supabase])

  return (
    <div className="max-w-4xl mx-auto py-6 px-5 md:py-10">
      {/* CABEÇALHO REFINADO */}
      <div className="text-center mb-10">
        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-[#c99090] mx-auto mb-4 shadow-sm">
          <Gem size={24} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight uppercase text-[#4a322e]">Olá, Empresária</h2>
        <p className="text-[#c99090] text-[8px] font-black tracking-[0.3em] uppercase italic mt-1">O brilho do seu negócio começa aqui. 💎</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* INVENTÁRIO COMPACTO */}
        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-rose-50 shadow-sm overflow-hidden">
          <h3 className="text-[8px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-6 flex items-center justify-center gap-2">
            <ShoppingBag size={12} /> Inventário por Categoria
          </h3>
          {loading ? <div className="flex justify-center p-6"><Loader2 className="animate-spin text-[#c99090]" size={20} /></div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map((stat, i) => (
                <div key={i} className={`p-4 rounded-3xl relative group ${i === 0 ? 'bg-[#4a322e] text-white shadow-md' : 'bg-rose-50/30 text-[#4a322e] hover:bg-rose-50/50'} transition-all`}>
                  <p className={`text-[6px] font-black uppercase tracking-widest mb-1 ${i === 0 ? 'text-rose-200' : 'text-[#c99090]'}`}>{stat.name}</p>
                  <h4 className="text-lg font-bold">{stat.count} <span className="text-[8px] font-light opacity-60">PÇS</span></h4>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FINANCEIRO FINO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[40px] border border-rose-50 shadow-sm text-center">
            <p className="text-[7px] font-black text-amber-700 uppercase tracking-widest mb-1">Custo Total (Estoque)</p>
            <h4 className="text-xl font-bold text-amber-900">R$ {finance.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          </div>
          <div className="bg-white p-6 rounded-[40px] border border-rose-50 shadow-sm text-center">
            <p className="text-[7px] font-black text-green-700 uppercase tracking-widest mb-1">Venda Total (Estoque)</p>
            <h4 className="text-xl font-bold text-green-900">R$ {finance.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          </div>
          <div className="sm:col-span-2 bg-[#4a322e] p-5 rounded-[40px] text-center shadow-lg">
             <p className="text-[7px] font-black text-rose-200 uppercase tracking-widest mb-1">Lucro Estimado Real</p>
             <h4 className="text-2xl font-bold text-white tracking-tighter">R$ {(finance.totalSales - finance.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>

        {/* AÇÃO RÁPIDA - REFINADA */}
        <div className="mt-4 flex justify-center">
          <Link href="/admin/products/new" className="w-full max-w-lg bg-[#4a322e] p-6 rounded-[40px] text-white flex items-center justify-between group hover:bg-[#c99090] transition-all shadow-xl active:scale-95 mx-2">
            <div className="flex items-center gap-4 pl-2">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlusCircle size={28} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-black uppercase tracking-[0.15em]">Cadastrar Nova Peça</h3>
                <p className="text-[7px] text-rose-200 font-bold uppercase tracking-[0.2em] mt-1 italic">Adicione brilho ao seu catálogo 💎</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
