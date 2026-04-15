'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, DollarSign, Calendar, User, Package, Plus, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Sale {
  id: string
  created_at: string
  product_id: string
  quantity: number
  sale_price: number
  cost_price: number
  customer_name: string
  products: {
    name: string
    image_url: string
  }
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const supabase = createClient()

  // Estado para nova venda
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSales()
    loadProducts()
  }, [])

  async function loadSales() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('sales')
      .select('*, products(name, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setSales(data as any)
    setLoading(false)
  }

  async function loadProducts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .gt('stock_quantity', 0)
      .order('name')
    
    if (data) setProducts(data)
  }

  async function handleRegisterSale(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProductId || quantity <= 0) return

    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const product = products.find(p => p.id === selectedProductId)

    if (!user || !product) return

    try {
      // 1. Registrar a Venda
      const { error: saleError } = await supabase.from('sales').insert({
        product_id: selectedProductId,
        user_id: user.id,
        quantity,
        sale_price: product.price,
        cost_price: product.cost_price || 0,
        customer_name: customerName
      })

      if (saleError) throw saleError

      // 2. Atualizar Estoque
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock_quantity: product.stock_quantity - quantity })
        .eq('id', selectedProductId)

      if (stockError) throw stockError

      setShowAddModal(false)
      setSelectedProductId('')
      setQuantity(1)
      setCustomerName('')
      loadSales()
      loadProducts()
      alert('VENDA REGISTRADA COM SUCESSO! 💎')
    } catch (err) {
      alert('ERRO AO REGISTRAR VENDA.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.sale_price * sale.quantity), 0)
  const totalProfit = sales.reduce((acc, sale) => acc + ((sale.sale_price - sale.cost_price) * sale.quantity), 0)

  return (
    <div className="max-w-4xl mx-auto py-6 px-5 md:py-10 pb-20">
      <div className="flex items-center justify-between mb-10">
        <Link href="/admin" className="p-2 hover:bg-brand-secondary/5 rounded-full transition-colors text-brand-secondary">
          <ArrowLeft size={20} />
        </Link>
        <div className="text-center flex-1 pr-8">
          <h2 className="text-2xl font-bold tracking-tight uppercase text-brand-primary">Gestão de Vendas</h2>
          <p className="text-brand-secondary text-[8px] font-black tracking-[0.3em] uppercase mt-1">Acompanhe o brilho do seu sucesso 💰</p>
        </div>
      </div>

      {/* RESUMO DE PERFORMANCE */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-white p-6 rounded-[30px] border border-brand-secondary/10 shadow-sm text-center">
          <p className="text-[7px] font-black text-brand-secondary uppercase tracking-widest mb-1">Faturamento Total</p>
          <h4 className="text-xl font-bold text-brand-primary">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>
        <div className="bg-brand-primary p-6 rounded-[30px] text-center shadow-lg">
          <p className="text-[7px] font-black text-brand-secondary/80 uppercase tracking-widest mb-1">Lucro Real Acumulado</p>
          <h4 className="text-xl font-bold text-white">R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>
      </div>

      <button 
        onClick={() => setShowAddModal(true)}
        className="w-full bg-brand-primary text-white py-5 rounded-[25px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-brand-secondary transition-all mb-10"
      >
        <Plus size={18} /> Registrar Nova Venda
      </button>

      {/* LISTA DE VENDAS */}
      <div className="space-y-4">
        <h3 className="text-[9px] font-black text-brand-primary uppercase tracking-[0.3em] mb-4 ml-2">Histórico Recente</h3>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-secondary" /></div>
        ) : sales.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] border border-brand-secondary/10 border-dashed">
             <p className="text-[10px] text-brand-secondary uppercase font-bold tracking-widest">Nenhuma venda registrada ainda. 💎</p>
          </div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className="bg-white p-4 rounded-[30px] border border-brand-secondary/5 shadow-sm flex items-center gap-4 group hover:border-brand-secondary/20 transition-all">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand-secondary/5 relative">
                <Image src={sale.products?.image_url || ''} alt={sale.products?.name || ''} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-[10px] font-bold text-brand-primary uppercase truncate max-w-[150px]">{sale.products?.name}</h4>
                  <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">+{sale.quantity} PÇ</span>
                </div>
                <div className="flex items-center gap-4 text-[9px] text-brand-secondary/60">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(sale.created_at).toLocaleDateString('pt-BR')}</span>
                  {sale.customer_name && <span className="flex items-center gap-1"><User size={10} /> {sale.customer_name.toUpperCase()}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-brand-primary">R$ {(sale.sale_price * sale.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[7px] font-black text-green-700 uppercase">Lucro: R$ {((sale.sale_price - sale.cost_price) * sale.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE REGISTRO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-brand-primary/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <h3 className="text-lg font-bold text-brand-primary uppercase text-center mb-8">Registrar Venda</h3>
            <form onSubmit={handleRegisterSale} className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-brand-secondary uppercase mb-2 block ml-1">Produto</label>
                <select 
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-brand-secondary/10 bg-rose-50/30 text-[10px] font-bold text-brand-primary outline-none focus:border-brand-primary"
                >
                  <option value="">SELECIONE A JOIA...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name.toUpperCase()} (ESTOQUE: {p.stock_quantity})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-brand-secondary uppercase mb-2 block ml-1">Quantidade</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full p-4 rounded-2xl border border-brand-secondary/10 bg-rose-50/30 text-[10px] font-bold text-brand-primary outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black text-brand-secondary uppercase mb-2 block ml-1">Cliente (Opcional)</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-brand-secondary/10 bg-rose-50/30 text-[10px] font-bold text-brand-primary outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-2xl border border-brand-secondary/10 text-[10px] font-black uppercase tracking-widest text-brand-secondary">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-4 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Confirmar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
