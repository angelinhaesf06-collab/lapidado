'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ShoppingCart, Loader2, ArrowLeft, Search, Check, Trash2, Plus, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

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

interface Product {
  id: string
  name: string
  price: number
  cost_price: number
  image_url: string
  stock_quantity: number
  categories?: { name: string }
}

interface Category {
  id: string
  name: string
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)) // YYYY-MM
  
  const supabase = createClient()

  // Estado para nova venda
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadSales = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('sales')
      .select('*, products(name, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setSales(data as unknown as Sale[])
    setLoading(false)
  }, [supabase])

  const loadProducts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .gt('stock_quantity', 0)
      .order('name')
    
    if (data) setProducts(data as unknown as Product[])
  }, [supabase])

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data as Category[])
  }, [supabase])

  useEffect(() => {
    loadSales()
    loadProducts()
    loadCategories()
  }, [loadSales, loadProducts, loadCategories])

  async function handleDeleteSale(id: string) {
    if (!confirm('DESEJA REALMENTE EXCLUIR ESTA VENDA? 💎\nISSO NÃO DEVOLVE O ITEM AO ESTOQUE AUTOMATICAMENTE.')) return

    try {
      const { error } = await supabase.from('sales').delete().eq('id', id)
      if (error) throw error
      
      setSales(sales.filter(s => s.id !== id))
      alert('VENDA EXCLUÍDA COM SUCESSO!')
    } catch {
      alert('ERRO AO EXCLUIR VENDA.')
    }
  }

  async function handleRegisterSale() {
    if (!selectedProduct || quantity <= 0) return

    if (quantity > selectedProduct.stock_quantity) {
      alert(`ESTOQUE INSUFICIENTE! VOCÊ TEM APENAS ${selectedProduct.stock_quantity} PEÇAS. 💎`)
      return
    }

    const isLastPiece = selectedProduct.stock_quantity === quantity
    if (isLastPiece) {
      if (!confirm('ESTA É A ÚLTIMA PEÇA DESTE ITEM NO ESTOQUE! 💎\nAPÓS ESTA VENDA, ELA SUMIRÁ AUTOMATICAMENTE DO SEU CATÁLOGO PÚBLICO ATÉ QUE VOCÊ ADICIONE MAIS ESTOQUE.\n\nDESEJA CONTINUAR?')) return
    }

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
    } catch {
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

  const filteredSales = sales.filter(sale => sale.created_at.startsWith(selectedMonth))

  const totalRevenue = filteredSales.reduce((acc, sale) => acc + (sale.sale_price * sale.quantity), 0)
  const totalProfit = filteredSales.reduce((acc, sale) => acc + ((sale.sale_price - sale.cost_price) * sale.quantity), 0)

  // 📈 Dados para o Gráfico (Últimos 6 meses)
  const chartData = useMemo(() => {
    const months = []
    const now = new Date(selectedMonth + '-01')
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = d.toISOString().substring(0, 7)
      
      const monthlyRevenue = sales
        .filter(s => s.created_at.startsWith(monthStr))
        .reduce((acc, s) => acc + (s.sale_price * s.quantity), 0)
      
      months.push({
        name: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
        faturamento: monthlyRevenue
      })
    }
    return months
  }, [sales, selectedMonth])

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight uppercase text-brand-primary">Gestão de Vendas</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Sua vitrine de sucessos reais 💰</p>
      </div>

      <div className="flex justify-center mb-10">
        <div className="bg-white px-6 py-3 rounded-[30px] border border-brand-secondary/10 shadow-sm flex items-center gap-4">
          <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">RELATÓRIO DE:</span>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-rose-50/50 border-none text-xs font-bold text-brand-primary uppercase outline-none focus:ring-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-[30px] border border-brand-secondary/10 shadow-sm text-center">
          <p className="text-[7px] font-black text-brand-secondary uppercase tracking-widest mb-1">Faturamento {selectedMonth}</p>
          <h4 className="text-xl font-bold text-brand-primary">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>
        <div className="bg-brand-primary p-6 rounded-[30px] text-center shadow-lg">
          <p className="text-[7px] font-black text-brand-secondary/80 uppercase tracking-widest mb-1">Lucro Real {selectedMonth}</p>
          <h4 className="text-xl font-bold text-white">R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>
      </div>

      {/* 📊 GRÁFICO DE PERFORMANCE */}
      <div className="bg-white p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm mb-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary"><TrendingUp size={18} /></div>
          <div>
            <h3 className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Desempenho Semestral</h3>
            <p className="text-[7px] font-bold text-brand-secondary uppercase">Evolução do seu faturamento real</p>
          </div>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4a322e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4a322e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 8, fontWeight: 900, fill: '#c99090'}} 
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '20px', 
                  border: 'none', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="faturamento" 
                stroke="#4a322e" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <button 
        onClick={() => setShowAddModal(true)}
        className="w-full bg-brand-primary text-white py-5 rounded-[25px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-brand-secondary transition-all mb-10"
      >
        <Plus size={18} /> Selecionar Peça e Vender
      </button>

      <div className="space-y-4">
        <h3 className="text-[9px] font-black text-brand-primary uppercase tracking-[0.3em] mb-4 ml-2">Vendas em {selectedMonth}</h3>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-secondary" /></div>
        ) : (
          filteredSales.map((sale) => (
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
