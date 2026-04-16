'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, DollarSign, Calendar, User, Package, Plus, Loader2, ArrowLeft, Search, Filter, Gem, Check, Trash2 } from 'lucide-react'
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
  const [categories, setCategories] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [searchQuery, setSearchQuery] = useState('')
  
  const supabase = createClient()

  // Estado para nova venda
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSales()
    loadProducts()
    loadCategories()
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
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .gt('stock_quantity', 0)
      .order('name')
    
    if (data) setProducts(data)
  }

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  async function handleDeleteSale(id: string) {
    if (!confirm('DESEJA REALMENTE EXCLUIR ESTA VENDA? 💎\nISSO NÃO DEVOLVE O ITEM AO ESTOQUE AUTOMATICAMENTE.')) return

    try {
      const { error } = await supabase.from('sales').delete().eq('id', id)
      if (error) throw error
      
      setSales(sales.filter(s => s.id !== id))
      alert('VENDA EXCLUÍDA COM SUCESSO!')
    } catch (err) {
      alert('ERRO AO EXCLUIR VENDA.')
    }
  }

  async function handleRegisterSale() {
    if (!selectedProduct || quantity <= 0) return

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { error: saleError } = await supabase.from('sales').insert({
        product_id: selectedProduct.id,
        user_id: user.id,
        quantity,
        sale_price: selectedProduct.price,
        cost_price: selectedProduct.cost_price || 0, // 💎 NEXUS: Usando a nova coluna oficial
        customer_name: customerName
      })

      if (saleError) throw saleError

      const { error: stockError } = await supabase
        .from('products')
        .update({ stock_quantity: selectedProduct.stock_quantity - quantity })
        .eq('id', selectedProduct.id)

      if (stockError) throw stockError

      setShowAddModal(false)
      setSelectedProduct(null)
      setQuantity(1)
      setCustomerName('')
      loadSales()
      loadProducts()
      alert('VENDA REGISTRADA COM SUCESSO! 💎')
    } catch (err) {
      alert('ERRO AO REGISTRAR VENDA.')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todas' || p.categories?.name === activeCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.sale_price * sale.quantity), 0)
  const totalProfit = sales.reduce((acc, sale) => acc + ((sale.sale_price - sale.cost_price) * sale.quantity), 0)

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight uppercase text-brand-primary">Gestão de Vendas</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Sua vitrine de sucessos reais 💰</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-white p-6 rounded-[30px] border border-brand-secondary/10 shadow-sm text-center">
          <p className="text-[7px] font-black text-brand-secondary uppercase tracking-widest mb-1">Faturamento Total</p>
          <h4 className="text-xl font-bold text-brand-primary">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>
        <div className="bg-brand-primary p-6 rounded-[30px] text-center shadow-lg">
          <p className="text-[7px] font-black text-brand-secondary/80 uppercase tracking-widest mb-1">Lucro Real</p>
          <h4 className="text-xl font-bold text-white">R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>
      </div>

      <button 
        onClick={() => setShowAddModal(true)}
        className="w-full bg-brand-primary text-white py-5 rounded-[25px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-brand-secondary transition-all mb-10"
      >
        <Plus size={18} /> Selecionar Peça e Vender
      </button>

      <div className="space-y-4">
        <h3 className="text-[9px] font-black text-brand-primary uppercase tracking-[0.3em] mb-4 ml-2">Vendas Realizadas</h3>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-secondary" /></div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className="bg-white p-4 rounded-[30px] border border-brand-secondary/5 shadow-sm flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-brand-secondary/5 relative">
                <Image src={sale.products?.image_url || ''} alt="" fill className="object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-bold text-brand-primary uppercase">{sale.products?.name}</h4>
                <div className="flex items-center gap-3 text-[8px] text-brand-secondary/60 uppercase font-black tracking-widest">
                  <span>{new Date(sale.created_at).toLocaleDateString('pt-BR')}</span>
                  {sale.customer_name && <span>• {sale.customer_name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs font-bold text-brand-primary">R$ {(sale.sale_price * sale.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <button 
                  onClick={() => handleDeleteSale(sale.id)}
                  className="p-2 text-rose-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[40px] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-brand-secondary/10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-brand-secondary/5 rounded-full"><ArrowLeft size={20} /></button>
                <h3 className="text-lg font-bold text-brand-primary uppercase">Escolha a Joia</h3>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40" size={16} />
                  <input type="text" placeholder="BUSCAR NOME..." className="w-full pl-12 pr-4 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <select className="p-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
                  <option value="Todas">TODAS</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 bg-rose-50/10">
              {filteredProducts.map(p => (
                <button key={p.id} onClick={() => setSelectedProduct(p)} className={`flex flex-col items-center p-4 rounded-[30px] border transition-all ${selectedProduct?.id === p.id ? 'bg-brand-primary border-brand-primary shadow-xl scale-105' : 'bg-white border-brand-secondary/10 hover:border-brand-primary'}`}>
                  <div className="aspect-square w-full rounded-2xl overflow-hidden mb-4 relative shadow-sm">
                    <Image src={p.image_url} alt="" fill className="object-cover" />
                    {selectedProduct?.id === p.id && <div className="absolute inset-0 bg-brand-primary/40 flex items-center justify-center text-white"><Check size={32} /></div>}
                  </div>
                  <h4 className={`text-[9px] font-bold uppercase tracking-widest text-center mb-1 truncate w-full ${selectedProduct?.id === p.id ? 'text-white' : 'text-brand-primary'}`}>{p.name}</h4>
                  <p className={`text-[8px] font-black uppercase ${selectedProduct?.id === p.id ? 'text-white/70' : 'text-brand-secondary'}`}>{p.stock_quantity} EM ESTOQUE</p>
                </button>
              ))}
            </div>

            {selectedProduct && (
              <div className="p-8 border-t border-brand-secondary/10 bg-white animate-in slide-in-from-bottom duration-500">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden relative border border-brand-secondary/10"><Image src={selectedProduct.image_url} alt="" fill className="object-cover" /></div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-primary uppercase">{selectedProduct.name}</h4>
                      <p className="text-lg font-light text-brand-primary">R$ {selectedProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-3 bg-rose-50/50 p-2 rounded-2xl border border-brand-secondary/10">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold shadow-sm">-</button>
                      <span className="w-8 text-center font-bold">{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(selectedProduct.stock_quantity, quantity + 1))} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold shadow-sm">+</button>
                    </div>
                    <input type="text" placeholder="NOME DA CLIENTE..." className="p-4 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase w-full md:w-48 outline-none focus:border-brand-primary" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    <button onClick={handleRegisterSale} disabled={isSaving} className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                      {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><ShoppingCart size={16} /> Confirmar Venda</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
