'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ShoppingCart, Loader2, ArrowLeft, Search, Check, Trash2, Plus, TrendingUp, CreditCard, Banknote, FileText, CheckCircle2, Printer, X, ShieldCheck, Gem, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { toast } from 'sonner'
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
  payment_method: string
  installments: number
  status: 'pago' | 'pendente'
  total_value: number
  customer_id: string
  customers: {
    name: string
    cpf: string
    address: string
    phone: string
  }
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

interface Customer {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface Branding {
  business_name: string
  tax_id: string
  state_registration: string
  phone: string
  address: string
  logo_url: string
  tiktok: string 
}

interface Installment {
  id: string
  sale_id: string
  installment_number: number
  value: number
  status: 'pago' | 'pendente'
  due_date: string
  sales: {
    customers: {
      name: string
    }
    products: {
      name: string
    }
  }
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [installmentsList, setInstallmentsList] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMoreSales, setLoadingMoreSales] = useState(false)
  const [salesPage, setSalesPage] = useState(0)
  const [hasMoreSales, setHasMoreSales] = useState(true)
  const PAGE_SIZE = 15

  const [showAddModal, setShowAddModal] = useState(false)
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null)
  const [branding, setBranding] = useState<Branding | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7))
  
  const supabase = createClient()
  const receiptRef = useRef<HTMLDivElement>(null)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [customerId, setCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cartao')
  const [installments, setInstallments] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  
  const loadSales = useCallback(async (isInitial = true) => {
    if (isInitial) setLoading(true)
    else setLoadingMoreSales(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const currentPage = isInitial ? 0 : salesPage + 1
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // ⚡ OTIMIZAÇÃO: Busca paginada de vendas
    const { data: salesData } = await supabase
      .from('sales')
      .select('*, products(name, image_url), customers(name, cpf, address, phone)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)
      
    if (salesData) {
      if (isInitial) {
        setSales(salesData as unknown as Sale[])
        setSalesPage(0)
      } else {
        setSales(prev => [...prev, ...(salesData as unknown as Sale[])])
        setSalesPage(currentPage)
      }
      setHasMoreSales(salesData.length === PAGE_SIZE)
    }

    if (isInitial) {
      // Carrega Parcelas (Apenas as primeiras 20 para ser rápido)
      const { data: instData } = await supabase
        .from('installments')
        .select('*, sales(customers(name), products(name))')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .order('due_date', { ascending: true })
        .limit(20)
      if (instData) setInstallmentsList(instData as unknown as Installment[])
      setLoading(false)
    } else {
      setLoadingMoreSales(false)
    }
  }, [supabase, salesPage])

  // Função para dar baixa em parcela
  async function handlePayInstallment(inst: Installment) {
    const newStatus = inst.status === 'pago' ? 'pendente' : 'pago'
    try {
      const { error } = await supabase
        .from('installments')
        .update({ status: newStatus })
        .eq('id', inst.id)
      if (error) throw error
      toast.success('Parcela atualizada!')
      loadSales()
    } catch { toast.error('Erro ao atualizar parcela.') }
  }

  // ... (keep useEffect and other functions)


  const loadBranding = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('branding').select('*').eq('user_id', user.id).single()
    if (data) setBranding(data)
  }, [supabase])
const loadProducts = useCallback(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // ⚡ OTIMIZAÇÃO: Busca essencial + categorias para o filtro funcionar
  const { data } = await supabase
    .from('products')
    .select('id, name, price, image_url, cost_price, stock_quantity, category_id, categories(name)')
    .eq('user_id', user.id)
    .gt('stock_quantity', 0)
    .order('name')

  if (data) setProducts(data as unknown as Product[])
}, [supabase])

  const loadCustomers = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('customers').select('id, name').eq('user_id', user.id).order('name')
    if (data) setCustomers(data)
  }, [supabase])

  useEffect(() => {
    loadSales()
    loadBranding()
    loadProducts()
    loadCustomers()
  }, [loadSales, loadBranding, loadProducts, loadCustomers, supabase])

  async function handleToggleStatus(sale: Sale) {
    const newStatus = sale.status === 'pago' ? 'pendente' : 'pago'
    try {
      const { error } = await supabase.from('sales').update({ status: newStatus }).eq('id', sale.id)
      if (error) throw error
      toast.success(`Status atualizado!`)
      loadSales()
    } catch { toast.error('Erro ao atualizar.') }
  }

  async function handleDeleteSale(id: string) {
    if (!confirm('Excluir esta venda?')) return
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id)
      if (error) throw error
      toast.success('Venda excluída!')
      loadSales()
    } catch { toast.error('Erro ao excluir.') }
  }

  async function handleRegisterSale() {
    if (!selectedProduct || !customerId) return toast.error('Dados incompletos!')
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')
      const totalValue = selectedProduct.price * quantity
      const { data: saleData, error: saleError } = await supabase.from('sales').insert({
        product_id: selectedProduct.id, user_id: user.id, customer_id: customerId, quantity,
        sale_price: selectedProduct.price, cost_price: selectedProduct.cost_price || 0,
        payment_method: paymentMethod, installments: paymentMethod === 'dinheiro' ? 1 : installments,
        total_value: totalValue, status: 'pendente'
      }).select().single()
      if (saleError) throw saleError

      const numI = paymentMethod === 'dinheiro' ? 1 : installments
      const instV = parseFloat((totalValue / numI).toFixed(2))
      const instR = []
      for (let i = 1; i <= numI; i++) {
        const d = new Date(); d.setDate(d.getDate() + (30 * i))
        instR.push({ sale_id: saleData.id, user_id: user.id, installment_number: i, value: i === numI ? totalValue - (instV * (numI - 1)) : instV, status: 'pendente', due_date: d.toISOString() })
      }
      await supabase.from('installments').insert(instR)
      await supabase.from('products').update({ stock_quantity: selectedProduct.stock_quantity - quantity }).eq('id', selectedProduct.id)

      setShowAddModal(false); setSelectedProduct(null); setCustomerId(''); loadSales(); loadProducts();
      toast.success('Venda Registrada! 💎')
    } catch (err: any) { toast.error(err.message) } finally { setIsSaving(false) }
  }

  const handleWhatsApp = (sale: Sale) => {
    if (!sale.customers?.phone) return toast.error('Cadastre o WhatsApp da cliente!')
    const cleanPhone = sale.customers.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(`Olá ${sale.customers.name}! 💎\n\nAqui está o comprovante da sua compra na *${branding?.business_name}*:\n\n💍 *Peça:* ${sale.products.name}\n💰 *Valor:* R$ ${sale.total_value.toLocaleString('pt-BR')}\n💳 *Pagamento:* ${sale.payment_method}\n📜 *Garantia:* ${branding?.tiktok || '1 ano'}\n\nObrigado! ✨`)
    window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${msg}`, '_blank')
  }

  const filteredSales = sales.filter(sale => sale.created_at.startsWith(selectedMonth))
  const [pendingReceivables, setPendingReceivables] = useState(0)
  const [totalReceivables, setTotalReceivables] = useState(0)

  useEffect(() => {
    async function loadRec() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // 💎 BUSCA TODAS AS PARCELAS PENDENTES
      const { data: allPending } = await supabase
        .from('installments')
        .select('value, due_date')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
      
      if (allPending) {
        setTotalReceivables(allPending.reduce((acc, curr) => acc + Number(curr.value), 0))
        
        // Filtragem por mês local para performance
        const monthPending = allPending.filter(inst => inst.due_date.startsWith(selectedMonth))
        setPendingReceivables(monthPending.reduce((acc, curr) => acc + Number(curr.value), 0))
      }
    }
    loadRec()
  }, [supabase, selectedMonth, sales])

  return (
    <div className="max-w-5xl mx-auto pb-20 print:p-0">
      <div className="print:hidden">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black uppercase text-brand-primary tracking-tighter">Gestão de Vendas</h2>
          <p className="text-[10px] font-black tracking-[0.3em] text-brand-secondary/60 uppercase">Controle Financeiro 💎</p>
        </div>

        <div className="flex justify-center mb-10 gap-4">
          <div className="bg-white px-6 py-3 rounded-full border border-brand-secondary/10 shadow-sm flex items-center gap-4">
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-xs font-black text-brand-primary uppercase outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-6 rounded-[30px] border border-brand-secondary/10 text-center shadow-sm">
            <p className="text-[7px] font-black text-brand-secondary uppercase mb-1">Vendido (Mês)</p>
            <h4 className="text-xl font-bold text-brand-primary">R$ {filteredSales.reduce((acc, s) => acc + (s.total_value || 0), 0).toLocaleString('pt-BR')}</h4>
          </div>
          
          <div className="bg-amber-500 p-6 rounded-[30px] text-center shadow-lg">
            <p className="text-[7px] font-black text-white/80 uppercase mb-1">A Receber (Mês)</p>
            <h4 className="text-xl font-bold text-white">R$ {pendingReceivables.toLocaleString('pt-BR')}</h4>
          </div>

          <div className="bg-brand-secondary p-6 rounded-[30px] text-center shadow-lg">
            <p className="text-[7px] font-black text-white/80 uppercase mb-1">A Receber (Total)</p>
            <h4 className="text-xl font-bold text-white">R$ {totalReceivables.toLocaleString('pt-BR')}</h4>
          </div>

          <div className="bg-brand-primary p-6 rounded-[30px] text-center shadow-lg">
            <p className="text-[7px] font-black text-white/80 uppercase mb-1">Lucro Estimado (Mês)</p>
            <h4 className="text-xl font-bold text-white">R$ {filteredSales.reduce((acc, s) => acc + ((s.total_value - (Number(s.cost_price || 0) * s.quantity)) || 0), 0).toLocaleString('pt-BR')}</h4>
          </div>
        </div>

        <button onClick={() => setShowAddModal(true)} className="w-full bg-brand-primary text-white py-5 rounded-[25px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl mb-8"><Plus size={18} /> Nova Venda Real</button>

        <div className="space-y-3">
          {filteredSales
            .map((sale) => {
            // 💎 NEXUS: Normalização de dados para Joins resilientes
            const productInfo = Array.isArray(sale.products) ? sale.products[0] : sale.products
            const imageUrl = productInfo?.image_url
            
            return (
              <div key={sale.id} className={`bg-white p-4 rounded-[25px] border flex items-center gap-3 md:gap-4 group ${sale.status === 'pago' ? 'border-green-100 bg-green-50/10' : 'border-brand-secondary/5 shadow-sm'}`}>
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden relative border border-brand-secondary/10 bg-rose-50/30 shrink-0">
                  {imageUrl ? (
                    <Image src={imageUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-secondary/20"><Gem size={20} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black text-brand-primary uppercase truncate pr-2">{productInfo?.name || 'Joia não identificada'}</h4>
                  <p className="text-[8px] font-bold text-brand-secondary/50 uppercase truncate">{sale.customers?.name} • {new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-brand-primary">R$ {sale.total_value.toLocaleString('pt-BR')}</p>
                    <button onClick={() => handleToggleStatus(sale)} className={`text-[6px] font-black uppercase px-2 py-0.5 rounded-full border ${sale.status === 'pago' ? 'bg-green-500 text-white border-green-500' : 'text-brand-secondary/40 border-brand-secondary/10'}`}>{sale.status === 'pago' ? 'PAGO' : 'PENDENTE'}</button>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setShowReceipt(sale)} className="p-2 md:p-2.5 bg-brand-secondary/5 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white transition-all"><Printer size={14} /></button>
                    <button onClick={() => handleDeleteSale(sale.id)} className="p-2 text-rose-200 hover:text-rose-500 md:opacity-0 md:group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 📜 CONTROLE DE PROMISSÓRIAS / PARCELAS */}
        <div className="mt-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-brand-primary uppercase tracking-tighter">Controle de Promissórias</h3>
              <p className="text-[8px] font-bold text-brand-secondary/40 uppercase">Acompanhamento de Recebimentos</p>
            </div>
          </div>

          <div className="bg-white rounded-[35px] border border-brand-secondary/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-secondary/5">
                    <th className="p-4 text-[7px] font-black uppercase text-brand-secondary/60 tracking-widest">Cliente</th>
                    <th className="p-4 text-[7px] font-black uppercase text-brand-secondary/60 tracking-widest">Vencimento</th>
                    <th className="p-4 text-[7px] font-black uppercase text-brand-secondary/60 tracking-widest">Parcela</th>
                    <th className="p-4 text-[7px] font-black uppercase text-brand-secondary/60 tracking-widest">Valor</th>
                    <th className="p-4 text-[7px] font-black uppercase text-brand-secondary/60 tracking-widest">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-secondary/5">
                  {installmentsList.filter(inst => inst.status === 'pendente').slice(0, 15).map((inst) => (
                    <tr key={inst.id} className="hover:bg-brand-secondary/5 transition-colors">
                      <td className="p-4">
                        <p className="text-[10px] font-black text-brand-primary uppercase">{inst.sales?.customers?.name || 'Cliente Excluído'}</p>
                        <p className="text-[7px] font-bold text-brand-secondary/40 uppercase truncate max-w-[120px]">{inst.sales?.products?.name}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-[9px] font-bold text-brand-primary">{new Date(inst.due_date).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-brand-secondary/10 text-brand-primary uppercase">Nº {inst.installment_number}</span>
                      </td>
                      <td className="p-4">
                        <p className="text-[10px] font-black text-brand-primary">R$ {inst.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handlePayInstallment(inst)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500 text-white text-[8px] font-black uppercase shadow-sm hover:scale-105 transition-all"
                        >
                          <CheckCircle2 size={12} /> Dar Baixa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {installmentsList.filter(inst => inst.status === 'pendente').length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="opacity-20 mb-2 flex justify-center"><CheckCircle2 size={32} /></div>
                        <p className="text-[8px] font-black text-brand-secondary/40 uppercase tracking-widest">Nenhuma promissória pendente</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 📄 COMPROVANTE ENXUTO 💎 */}
      {showReceipt && (
        <div className="fixed inset-0 bg-white z-[300] flex flex-col p-8 md:p-12 print:p-0">
          <div className="max-w-xl mx-auto w-full space-y-8">
            <div className="flex justify-between items-center print:hidden border-b border-brand-secondary/10 pb-6 mb-4">
               <button onClick={() => setShowReceipt(null)} className="p-2 bg-brand-secondary/5 rounded-full text-brand-primary"><ArrowLeft size={20} /></button>
               <div className="flex gap-4">
                  <button onClick={() => handleWhatsApp(showReceipt)} className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Phone size={14} /> WhatsApp</button>
                  <button onClick={() => window.print()} className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Printer size={14} /> Imprimir</button>
               </div>
            </div>

            <div className="space-y-10">
               <div className="text-center space-y-2">
                  <h1 className="text-2xl font-black text-brand-primary uppercase tracking-tighter">{branding?.business_name}</h1>
                  <p className="text-[10px] font-bold text-brand-secondary/60 uppercase">{branding?.tax_id && `CNPJ/CPF: ${branding.tax_id}`} {branding?.state_registration && `• IE: ${branding.state_registration}`}</p>
                  <p className="text-[10px] font-bold text-brand-secondary/60 uppercase">{branding?.address}</p>
               </div>

               <div className="bg-brand-secondary/5 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-end border-b border-brand-primary/10 pb-4">
                     <div><p className="text-[8px] font-black text-brand-primary/40 uppercase mb-1">Cliente</p><p className="text-sm font-black text-brand-primary uppercase">{showReceipt.customers?.name}</p></div>
                     <div className="text-right"><p className="text-[8px] font-black text-brand-primary/40 uppercase mb-1">Data</p><p className="text-xs font-bold text-brand-primary">{new Date(showReceipt.created_at).toLocaleDateString('pt-BR')}</p></div>
                  </div>
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden relative border border-white shadow-sm">
                           {(() => {
                              const productInfo = Array.isArray(showReceipt.products) ? showReceipt.products[0] : showReceipt.products
                              return productInfo?.image_url ? (
                                <Image src={productInfo.image_url} alt="" fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-brand-secondary/20"><Gem size={14} /></div>
                              )
                           })()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-brand-primary uppercase">
                            {(Array.isArray(showReceipt.products) ? showReceipt.products[0] : showReceipt.products)?.name || 'JOIA'}
                          </p>
                          <p className="text-[9px] font-bold text-brand-secondary/50 uppercase">{showReceipt.quantity} unidade(s)</p>
                        </div>
                     </div>
                     <div className="text-right"><p className="text-[8px] font-black text-brand-primary/40 uppercase mb-1">Total</p><p className="text-lg font-black text-brand-primary">R$ {showReceipt.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                  </div>
               </div>

               <div className="border-t border-dashed border-brand-secondary/20 pt-6">
                  <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldCheck size={14} /> Certificado de Garantia</p>
                  <p className="text-[9px] text-brand-secondary/60 font-medium uppercase leading-relaxed text-justify">
                    A marca *{branding?.business_name}* garante esta joia contra defeitos de fabricação e no banho pelo período de **{branding?.tiktok || '1 ano'}**. Esta garantia não cobre danos por mau uso, quebras ou contato com agentes químicos.
                  </p>
               </div>

               <div className="text-center pt-8 opacity-20"><Gem className="mx-auto" size={24} /></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADICIONAR (UNCHANGED CODE ...) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-brand-primary/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[40px] flex flex-col overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-brand-secondary/10 flex justify-between items-center">
                <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest flex items-center gap-3"><ShoppingCart size={18} /> Nova Venda Real</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-rose-50 rounded-full"><X size={20} /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-3 sm:grid-cols-4 gap-2 md:gap-4 bg-rose-50/10 scrollbar-hide">
                {products
                  .filter(p => {
                    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
                    return matchesSearch
                  })
                  .map(p => (
                  <button key={p.id} onClick={() => setSelectedProduct(p)} className={`p-2 md:p-3 rounded-[20px] md:rounded-[30px] border transition-all ${selectedProduct?.id === p.id ? 'bg-brand-primary border-brand-primary scale-105 shadow-xl' : 'bg-white border-brand-secondary/5'}`}>
                    <div className="aspect-square w-full rounded-[15px] md:rounded-[20px] overflow-hidden mb-1 md:mb-2 relative bg-brand-secondary/5 flex items-center justify-center">
                      {p.image_url ? (
                        <Image src={p.image_url} alt="" fill className="object-cover" />
                      ) : (
                        <Gem size={16} className="text-brand-secondary/20" />
                      )}
                      {selectedProduct?.id === p.id && <div className="absolute inset-0 bg-brand-primary/40 flex items-center justify-center text-white"><Check size={20} /></div>}
                    </div>
                    <p className={`text-[7px] md:text-[8px] font-black uppercase truncate ${selectedProduct?.id === p.id ? 'text-white' : 'text-brand-primary'}`}>{p.name}</p>
                    <p className={`text-[6px] md:text-[7px] font-bold ${selectedProduct?.id === p.id ? 'text-white/60' : 'text-brand-secondary/40'}`}>R$ {p.price.toLocaleString('pt-BR')}</p>
                  </button>
                ))}
             </div>

             {selectedProduct && (
               <div className="p-6 bg-white border-t border-brand-secondary/10 space-y-4 animate-in slide-in-from-bottom duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <select className="w-full p-4 rounded-2xl bg-brand-secondary/5 border-none text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-brand-primary" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                          <option value="">SELECIONE A CLIENTE</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                       </select>
                       <div className="flex gap-2">
                          {['cartao', 'promissoria', 'dinheiro'].map(m => (
                             <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 py-3 rounded-xl border text-[8px] font-black uppercase transition-all ${paymentMethod === m ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white border-brand-secondary/10 text-brand-secondary/40'}`}>{m}</button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                             <label className="text-[7px] font-black uppercase text-brand-secondary/40 ml-2">Parcelas</label>
                             <input type="number" min="1" max="12" className="w-full p-3 rounded-xl bg-brand-secondary/5 text-xs font-black outline-none" value={installments} onChange={e => setInstallments(Number(e.target.value))} disabled={paymentMethod === 'dinheiro'} />
                          </div>
                          <div className="flex-1">
                             <label className="text-[7px] font-black uppercase text-brand-secondary/40 ml-2">Qtd</label>
                             <input type="number" min="1" className="w-full p-3 rounded-xl bg-brand-secondary/5 text-xs font-black outline-none" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                          </div>
                       </div>
                       <button onClick={handleRegisterSale} disabled={isSaving} className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                         {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><ShoppingCart size={16} /> FINALIZAR VENDA DE R$ {(selectedProduct.price * quantity).toLocaleString('pt-BR')}</>}
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
