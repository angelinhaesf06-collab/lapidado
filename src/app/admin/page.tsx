'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, PlusCircle, Gem, Loader2, DollarSign, Pencil, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboard() {
  const [stats, setStats] = useState<{name: string, count: number}[]>([])
  const [finance, setFinance] = useState({ totalCost: 0, totalSales: 0 })
  const [lowStockItems, setLowStockItems] = useState<{id: string, name: string, stock: number}[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: categories } = await supabase.from('categories').select('id, name').eq('user_id', user.id)
        
        // 💎 NEXUS: CONSULTA RESILIENTE E ISOLADA
        const { data: products, error: pError } = await supabase.from('products').select('*').eq('user_id', user.id)
        
        if (pError) throw pError;

        if (categories && products) {
          // 1. ESTATÍSTICAS DE CATEGORIAS
          const totalItemsCount = products.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0)
          const counts = categories.map(cat => ({
            name: cat.name.toUpperCase(),
            count: products.filter(p => p.category_id === cat.id).reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0)
          }))
          
          // 💎 NEXUS: ADICIONAR CONTAGEM DE ITENS SEM CATEGORIA
          const noCategoryCount = products.filter(p => !p.category_id).reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0)
          if (noCategoryCount > 0) {
            counts.push({ name: 'SEM CATEGORIA', count: noCategoryCount })
          }

          setStats([{ name: 'TOTAL DE PEÇAS', count: totalItemsCount }, ...counts])

          // 2. FINANCEIRO (Fórmulas Blindadas)
          const totalCost = products.reduce((acc, p) => {
            let cost = 0
            const prod = p as any
            // Tenta coluna direta primeiro, depois descrição
            if (prod.cost_price && Number(prod.cost_price) > 0) {
              cost = Number(prod.cost_price)
            } else if (p.description) {
              const match = p.description.match(/DATA:({.*})/)
              if (match) {
                try {
                  const data = JSON.parse(match[1])
                  cost = Number(data.cost) || 0
                } catch { cost = 0 }
              }
            }
            return acc + (cost * (Number(p.stock_quantity) || 0))
          }, 0)
          const totalSales = products.reduce((acc, p) => acc + ((Number(p.price) || 0) * (Number(p.stock_quantity) || 0)), 0)
          setFinance({ totalCost, totalSales })

          // 3. BAIXO ESTOQUE (<= 2 unidades)
          const lowStock = products
            .filter(p => (Number(p.stock_quantity) || 0) <= 2)
            .map(p => ({ id: p.id, name: p.name, stock: Number(p.stock_quantity) || 0 }))
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5)
          setLowStockItems(lowStock)
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
        <div className="w-12 h-12 bg-brand-secondary/10 rounded-full flex items-center justify-center text-brand-secondary mx-auto mb-4 shadow-sm">
          <Gem size={24} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight uppercase text-brand-primary">Olá, Empresária</h2>
        <p className="text-brand-secondary text-[8px] font-black tracking-[0.3em] uppercase mt-1">O brilho do seu negócio começa aqui. 💎</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* INVENTÁRIO COMPACTO */}
        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm overflow-hidden">
          <h3 className="text-[8px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-6 flex items-center justify-center gap-2">
            <ShoppingBag size={12} /> Inventário por Categoria
          </h3>
          {loading ? <div className="flex justify-center p-6"><Loader2 className="animate-spin text-brand-secondary" size={20} /></div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map((stat, i) => (
                <div key={i} className={`p-4 rounded-3xl relative group ${i === 0 ? 'bg-brand-primary text-white shadow-md' : 'bg-brand-secondary/5 text-brand-primary hover:bg-brand-secondary/10'} transition-all`}>
                  <p className={`text-[6px] font-black uppercase tracking-widest mb-1 ${i === 0 ? 'text-brand-secondary/50' : 'text-brand-secondary'}`}>{stat.name}</p>
                  <h4 className="text-lg font-bold">{stat.count} <span className="text-[8px] font-light opacity-60">PÇS</span></h4>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ALERTA DE REPOSIÇÃO (BAIXO ESTOQUE) */}
        {!loading && lowStockItems.length > 0 && (
          <div className="bg-rose-50 p-6 rounded-[40px] border border-rose-100 shadow-sm">
            <h3 className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <AlertCircle size={12} /> Alerta de Reposição
            </h3>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white/60 p-3 rounded-2xl border border-rose-100">
                  <span className="text-[9px] font-bold text-brand-primary uppercase truncate mr-4">{item.name}</span>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${item.stock === 0 ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    {item.stock} PÇS
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINANCEIRO FINO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[40px] border border-brand-secondary/10 shadow-sm text-center">
            <p className="text-[7px] font-black text-amber-700 uppercase tracking-widest mb-1">Custo Total (Estoque)</p>
            <h4 className="text-xl font-bold text-amber-900">R$ {finance.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          </div>
          <div className="bg-white p-6 rounded-[40px] border border-brand-secondary/10 shadow-sm text-center">
            <p className="text-[7px] font-black text-green-700 uppercase tracking-widest mb-1">Venda Total (Estoque)</p>
            <h4 className="text-xl font-bold text-green-900">R$ {finance.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          </div>
          <div className="sm:col-span-2 bg-brand-primary p-5 rounded-[40px] text-center shadow-lg">
             <p className="text-[7px] font-black text-brand-secondary/80 uppercase tracking-widest mb-1">Lucro Estimado Real</p>
             <h4 className="text-2xl font-bold text-white tracking-tighter">R$ {(finance.totalSales - finance.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>

        {/* AÇÃO RÁPIDA - REFINADA */}
        <div className="mt-4 flex justify-center">
          <Link href="/admin/products/new" className="w-full max-w-lg bg-brand-primary p-6 rounded-[40px] text-white flex items-center justify-between group hover:bg-brand-secondary transition-all shadow-xl active:scale-95 mx-2">
            <div className="flex items-center gap-4 pl-2">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlusCircle size={28} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-black uppercase tracking-[0.15em]">Cadastrar Nova Peça</h3>
                <p className="text-[7px] text-brand-secondary/80 font-bold uppercase tracking-[0.2em] mt-1">Adicione brilho ao seu catálogo 💎</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
