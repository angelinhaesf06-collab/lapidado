'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, PlusCircle, Gem, Loader2, DollarSign, Pencil, AlertCircle, TrendingUp, BarChart3, Package } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    stockCost: 0,
    stockSales: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
    totalSalesCount: 0
  })
  
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. DADOS DE PRODUTOS E ESTOQUE
        const { data: products } = await supabase.from('products').select('*').eq('user_id', user.id)
        
        // 2. DADOS DE VENDAS
        const { data: sales } = await supabase.from('sales').select('*').eq('user_id', user.id)

        if (products) {
          const totalItems = products.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0)
          const lowStock = products.filter(p => (Number(p.stock_quantity) || 0) <= 2).length
          const stockCost = products.reduce((acc, p) => acc + ((Number(p.cost_price) || 0) * (Number(p.stock_quantity) || 0)), 0)
          const stockSales = products.reduce((acc, p) => acc + ((Number(p.price) || 0) * (Number(p.stock_quantity) || 0)), 0)

          let monthlyRevenue = 0
          let monthlyProfit = 0
          let totalSalesCount = 0

          if (sales) {
            totalSalesCount = sales.length
            monthlyRevenue = sales.reduce((acc, s) => acc + (Number(s.sale_price) * Number(s.quantity)), 0)
            monthlyProfit = sales.reduce((acc, s) => acc + ((Number(s.sale_price) - Number(s.cost_price)) * Number(s.quantity)), 0)
          }

          setStats({
            totalItems,
            lowStock,
            stockCost,
            stockSales,
            monthlyRevenue,
            monthlyProfit,
            totalSalesCount
          })
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
    <div className="max-w-4xl mx-auto py-6 px-5 md:py-10 pb-24">
      {/* CABEÇALHO REFINADO */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mx-auto mb-4 shadow-sm">
          <Gem size={28} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight uppercase text-brand-primary">Painel Lapidado</h2>
        <p className="text-brand-secondary text-[8px] font-black tracking-[0.3em] uppercase mt-1">Gestão de Luxo para o seu Negócio 💎</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* DASHBOARD DE PERFORMANCE (VENDAS REAIS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/sales" className="bg-brand-primary p-8 rounded-[40px] text-white shadow-xl hover:scale-[1.02] transition-all group">
            <div className="flex justify-between items-start mb-4">
               <TrendingUp size={24} className="text-brand-secondary" />
               <span className="text-[7px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded-full">Ver Detalhes</span>
            </div>
            <p className="text-[8px] font-black text-brand-secondary/80 uppercase tracking-widest mb-1">Lucro Real (Vendas)</p>
            <h4 className="text-3xl font-bold tracking-tighter mb-4">R$ {stats.monthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <div>
                <p className="text-[6px] font-black uppercase text-brand-secondary/60">Faturamento</p>
                <p className="text-sm font-bold">R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-[6px] font-black uppercase text-brand-secondary/60">Pedidos</p>
                <p className="text-sm font-bold">{stats.totalSalesCount}</p>
              </div>
            </div>
          </Link>

          <div className="bg-white p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <Package size={24} className="text-brand-primary" />
                {stats.lowStock > 0 && <span className="text-[7px] font-black uppercase tracking-widest bg-rose-100 text-rose-600 px-2 py-1 rounded-full">Reposição Necessária</span>}
              </div>
              <p className="text-[8px] font-black text-brand-secondary uppercase tracking-widest mb-1">Itens em Estoque</p>
              <h4 className="text-3xl font-bold text-brand-primary tracking-tighter">{stats.totalItems} <span className="text-xs font-light text-brand-secondary uppercase">Peças</span></h4>
            </div>
            <div className="pt-6 grid grid-cols-2 gap-4">
               <div>
                 <p className="text-[6px] font-black uppercase text-brand-secondary">Valor Parado</p>
                 <p className="text-[10px] font-bold text-brand-primary">R$ {stats.stockCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
               </div>
               <div>
                 <p className="text-[6px] font-black uppercase text-brand-secondary">Potencial Venda</p>
                 <p className="text-[10px] font-bold text-brand-primary">R$ {stats.stockSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
               </div>
            </div>
          </div>
        </div>

        {/* ACÇÕES RÁPIDAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/products/new" className="bg-white p-6 rounded-[35px] border border-brand-secondary/10 shadow-sm flex items-center gap-4 hover:border-brand-primary transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
              <PlusCircle size={24} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Cadastrar Joia</h3>
              <p className="text-[7px] font-bold text-brand-secondary uppercase">Novo brilho no acervo</p>
            </div>
          </Link>

          <Link href="/admin/sales" className="bg-white p-6 rounded-[35px] border border-brand-secondary/10 shadow-sm flex items-center gap-4 hover:border-brand-primary transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/5 flex items-center justify-center text-brand-secondary group-hover:bg-brand-primary group-hover:text-white transition-all">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Registrar Venda</h3>
              <p className="text-[7px] font-bold text-brand-secondary uppercase">Nova conquista realizada</p>
            </div>
          </Link>
        </div>

        {/* ALERTA DE REPOSIÇÃO (Sutil) */}
        {stats.lowStock > 0 && (
          <div className="bg-rose-50/50 p-6 rounded-[35px] border border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-500" />
              <div>
                <p className="text-[9px] font-bold text-rose-800 uppercase tracking-widest">Atenção ao Estoque</p>
                <p className="text-[7px] text-rose-600 font-bold uppercase">{stats.lowStock} modelos estão com 2 ou menos unidades.</p>
              </div>
            </div>
            <Link href="/admin" className="text-[8px] font-black uppercase tracking-widest text-rose-600 border-b border-rose-200">Ver Itens</Link>
          </div>
        )}

      </div>
    </div>
  )
}
