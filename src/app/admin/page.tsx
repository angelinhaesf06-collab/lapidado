'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, AlertCircle, TrendingUp, Package, ShoppingCart, Truck } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    stockCost: 0,
    stockSales: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
    totalSalesCount: 0,
    pendingReceivables: 0
  })
  
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error("Usuário não identificado")
          return
        }

        // 🔒 SEGURANÇA TOTAL: Busca ultra-otimizada
        const [productsRes, salesRes, installmentsRes] = await Promise.all([
          supabase.from('products').select('id, cost_price, price, stock_quantity, user_id').eq('user_id', user.id),
          supabase.from('sales').select('id, sale_price, quantity, cost_price, product_id, user_id').eq('user_id', user.id),
          supabase.from('installments').select('value').eq('user_id', user.id).eq('status', 'pendente')
        ])

        const products = productsRes.data
        const sales = salesRes.data
        const installments = installmentsRes.data

        if (products) {
          const totalItems = products.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0)
          
          // 💎 NEXUS: Cálculo resiliente de custo de estoque
          const stockCost = products.reduce((acc, p) => {
            const cost = Number(p.cost_price) || 0
            const stock = Number(p.stock_quantity) || 0
            return acc + (cost * stock)
          }, 0)

          const stockSales = products.reduce((acc, p) => {
            const price = Number(p.price) || 0
            const stock = Number(p.stock_quantity) || 0
            return acc + (price * stock)
          }, 0)

          let monthlyRevenue = 0
          let monthlyProfit = 0
          let totalSalesCount = 0

          if (sales && sales.length > 0) {
            totalSalesCount = sales.length
            
            // 💰 Faturamento Total (Realizado)
            monthlyRevenue = sales.reduce((acc, s) => {
              const price = Number(s.sale_price) || 0
              const qty = Number(s.quantity) || 1
              return acc + (price * qty)
            }, 0)
            
            // 💎 NEXUS: Cálculo de Lucro Real com Fallback de Custo
            monthlyProfit = sales.reduce((acc, s) => {
              const salePrice = Number(s.sale_price) || 0
              const quantity = Number(s.quantity) || 1
              
              // 1. Tenta custo gravado na venda
              // 2. Se for 0, tenta custo atual do produto
              // 3. Se não achar, usa 0 (Lucro = Venda)
              const prod = products.find(p => p.id === s.product_id)
              const savedCost = Number(s.cost_price)
              const currentProdCost = Number(prod?.cost_price)
              
              const costPrice = savedCost > 0 ? savedCost : (currentProdCost || 0)
              
              const profitPerUnit = salePrice - costPrice
              return acc + (profitPerUnit * quantity)
            }, 0)
          }

          setStats({
            totalItems,
            stockCost,
            stockSales,
            monthlyRevenue,
            monthlyProfit,
            totalSalesCount,
            pendingReceivables: installments?.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0) || 0
          })
        }
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err)
      }
    }
    loadDashboardData()
  }, [supabase])

  return (
    <div className="max-w-5xl mx-auto">
      {/* CABEÇALHO REFINADO */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold tracking-tight uppercase text-brand-primary">Resumo do Negócio</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">O brilho dos seus resultados 💎</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* DASHBOARD DE PERFORMANCE (VENDAS REAIS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          <Link href="/admin/sales" className="bg-amber-500 p-8 rounded-[40px] text-white shadow-xl hover:scale-[1.02] transition-all group">
            <div className="flex justify-between items-start mb-4">
               <AlertCircle size={24} className="text-amber-200" />
               <span className="text-[7px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded-full">Promissórias</span>
            </div>
            <p className="text-[8px] font-black text-amber-100 uppercase tracking-widest mb-1">Contas a Receber</p>
            <h4 className="text-3xl font-bold tracking-tighter mb-4">R$ {stats.pendingReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
            <div className="pt-4 border-t border-white/10">
              <p className="text-[6px] font-black uppercase text-amber-100/60">Total Pendente</p>
              <p className="text-[10px] font-bold">Parcelas e Promissórias</p>
            </div>
          </Link>

          <div className="bg-white p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <Package size={24} className="text-brand-primary" />
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

          <Link href="/admin/suppliers" className="bg-white p-6 rounded-[35px] border border-brand-secondary/10 shadow-sm flex items-center gap-4 hover:border-brand-primary transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Fornecedores</h3>
              <p className="text-[7px] font-bold text-brand-secondary uppercase">Gestão de Compras</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  )
}
