'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, Phone, ExternalLink, Trash2, Search, Store, Receipt, ShoppingBag, X, Check, Camera, Sparkles, Pencil, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Supplier {
  id: string
  created_at: string
  name: string
  category: string
  phone?: string
  link?: string
  notes?: string
}

interface Product {
  id: string
  name: string
  stock_quantity: number
  price?: number
}

interface PurchaseItem {
  productId?: string
  name: string
  quantity: number
  unitCost: number
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  
  // 💎 ESTADOS PARA ROMANEIO (COMPRA)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([{ name: '', quantity: 1, unitCost: 0 }])
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [isFinishingPurchase, setIsFinishingPurchase] = useState(false)
  const [isReadingPhoto, setIsReadingPhoto] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [phone, setPhone] = useState('')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')

  const supabase = createClient()

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: supData } = await supabase.from('suppliers').select('*').eq('user_id', user.id).order('name')
    if (supData) setSuppliers(supData as Supplier[])

    const { data: prodData } = await supabase.from('products').select('id, name, stock_quantity, price').eq('user_id', user.id).order('name')
    if (prodData) setProducts(prodData as Product[])

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s)
    setName(s.name)
    setCategory(s.category)
    setPhone(s.phone || '')
    setLink(s.link || '')
    setNotes(s.notes || '')
    setShowAddModal(true)
  }

  const closeFormModal = () => {
    setShowAddModal(false)
    setEditingSupplier(null)
    setName('')
    setCategory('')
    setPhone('')
    setLink('')
    setNotes('')
  }

  // 🤖 MÁGICA LAPIDADO: LEITURA DE ARQUIVO (FOTO OU PDF)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsReadingPhoto(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      try {
        const res = await fetch('/api/ai/romaneio', {
          method: 'POST',
          body: JSON.stringify({ image: base64 })
        })
        const data = await res.json()
        if (Array.isArray(data)) {
          // Tenta vincular os nomes lidos aos IDs de produtos existentes
          const mappedItems = data.map(item => {
            const foundProd = products.find(p => p.name.toUpperCase().includes(item.name.toUpperCase()) || item.name.toUpperCase().includes(p.name.toUpperCase()))
            return {
              ...item,
              productId: foundProd?.id
            }
          })
          setPurchaseItems(mappedItems)
          alert('ARQUIVO PROCESSADO COM SUCESSO! 💎✨ CONFERE OS ITENS ABAIXO.')
        }
      } catch (err) {
        console.error(err)
        alert('ERRO AO PROCESSAR ARQUIVO. CERTIFIQUE-SE DE QUE O DOCUMENTO É LEGÍVEL.')
      } finally {
        setIsReadingPhoto(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // 📄 FUNÇÃO PARA GERAR PDF DO ROMANEIO
  const generatePDF = (supplierName: string, items: PurchaseItem[], total: number, dateStr: string) => {
    const doc = new jsPDF()
    const formattedDate = dateStr.split('-').reverse().join('/')

    // Design Luxuoso (DNA da Marca)
    doc.setFontSize(22)
    doc.setTextColor(74, 50, 46) // brand-primary
    doc.text('LAPIDADO', 105, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setTextColor(201, 144, 144) // brand-secondary
    doc.text('ROMANEIO DE COMPRA E REPOSIÇÃO', 105, 28, { align: 'center' })

    doc.setDrawColor(201, 144, 144)
    doc.line(20, 35, 190, 35)

    doc.setFontSize(12)
    doc.setTextColor(74, 50, 46)
    doc.text(`FORNECEDOR: ${supplierName}`, 20, 45)
    doc.text(`DATA DA COMPRA: ${formattedDate}`, 190, 45, { align: 'right' })

    const tableData = items.map(item => [
      item.name.toUpperCase(),
      item.quantity,
      `R$ ${item.unitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${(item.quantity * item.unitCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ])

    autoTable(doc, {
      startY: 55,
      head: [['ITEM / PRODUTO', 'QNT', 'CUSTO UNIT.', 'SUBTOTAL']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [74, 50, 46], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      foot: [['', '', 'TOTAL INVESTIDO', `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]],
      footStyles: { fillColor: [201, 144, 144], textColor: [255, 255, 255], fontStyle: 'bold' }
    })

    doc.save(`romaneio-${supplierName.toLowerCase()}-${dateStr}.pdf`)
  }

  // 📄 FUNÇÃO PARA GERAR PDF DO ROMANEIO DA LOJA (ESTOQUE ATUAL)
  const generateStorePDF = () => {
    if (products.length === 0) {
      alert('NÃO HÁ PRODUTOS NO ESTOQUE PARA GERAR O ROMANEIO. 💎')
      return
    }

    const doc = new jsPDF()
    const date = new Date().toLocaleDateString('pt-BR')

    // Design Luxuoso (DNA da Marca)
    doc.setFontSize(22)
    doc.setTextColor(74, 50, 46) // brand-primary
    doc.text('LAPIDADO', 105, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setTextColor(201, 144, 144) // brand-secondary
    doc.text('ROMANEIO DE ESTOQUE ATUAL', 105, 28, { align: 'center' })

    doc.setDrawColor(201, 144, 144)
    doc.line(20, 35, 190, 35)

    doc.setFontSize(12)
    doc.setTextColor(74, 50, 46)
    doc.text(`CATÁLOGO: LAPIDADO - MEU ACERVO`, 20, 45)
    doc.text(`DATA: ${date}`, 190, 45, { align: 'right' })

    const tableData = products.map(p => [
      p.name.toUpperCase(),
      p.stock_quantity,
      `R$ ${(p.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${(p.stock_quantity * (p.price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ])

    autoTable(doc, {
      startY: 55,
      head: [['PRODUTO / JOIA', 'QNT', 'PREÇO VENDA', 'TOTAL']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [74, 50, 46], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
    })

    doc.save(`romaneio-estoque-${date.replace(/\//g, '-')}.pdf`)
  }

  const handleFinishPurchase = async () => {
    if (!selectedSupplier || purchaseItems.some(i => !i.name || i.quantity <= 0)) {
      alert('PREENCHA TODOS OS ITENS CORRETAMENTE! 💎')
      return
    }

    setIsFinishingPurchase(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const total = purchaseItems.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0)

      // 1. Criar Registro de Compra com a Data selecionada
      const { data: purchase, error: pError } = await supabase.from('purchases').insert({
        user_id: user.id,
        supplier_id: selectedSupplier.id,
        total_amount: total,
        created_at: new Date(purchaseDate).toISOString() // Forçar a data escolhida
      }).select().single()

      if (pError) throw pError

      // 2. Criar Itens
      for (const item of purchaseItems) {
        await supabase.from('purchase_items').insert({
          purchase_id: purchase.id,
          product_id: item.productId || null,
          name: item.name.toUpperCase(),
          quantity: item.quantity,
          unit_cost: item.unitCost
        })
      }

      generatePDF(selectedSupplier.name, purchaseItems, total, purchaseDate)
      alert('COMPRA FINALIZADA COM SUCESSO! 🚀💎')
      setShowPurchaseModal(false)
      loadData()
    } catch (err) {
      console.error(err)
      alert('ERRO AO FINALIZAR COMPRA.')
    } finally {
      setIsFinishingPurchase(false)
    }
  }

  async function handleSaveSupplier() {
    if (!name || !category) return

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const supplierData = {
        user_id: user.id,
        name: name.toUpperCase(),
        category: category.toUpperCase(),
        phone,
        link,
        notes
      }

      if (editingSupplier) {
        const { error } = await supabase.from('suppliers').update(supplierData).eq('id', editingSupplier.id)
        if (error) throw error
        alert('FORNECEDOR ATUALIZADO COM SUCESSO! 💎')
      } else {
        const { error } = await supabase.from('suppliers').insert(supplierData)
        if (error) throw error
        alert('FORNECEDOR CADASTRADO COM SUCESSO! 💎')
      }

      closeFormModal()
      loadData()
    } catch {
      alert('ERRO AO SALVAR FORNECEDOR.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteSupplier(id: string) {
    if (!confirm('DESEJA REALMENTE EXCLUIR ESTE FORNECEDOR?')) return

    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
      setSuppliers(suppliers.filter(s => s.id !== id))
    } catch {
      alert('ERRO AO EXCLUIR.')
    }
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight uppercase text-brand-primary">Compras & Fornecedores</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Sua rede estratégica de parcerias 🤝</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40" size={16} />
          <input 
            type="text" 
            placeholder="BUSCAR FORNECEDOR OU CATEGORIA..." 
            className="w-full pl-12 pr-4 py-4 rounded-[25px] bg-white border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none focus:border-brand-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={generateStorePDF}
          className="bg-white border-2 border-brand-primary text-brand-primary px-8 py-4 rounded-[25px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-md hover:bg-brand-primary hover:text-white transition-all"
        >
          <Receipt size={18} /> Romaneio da Loja
        </button>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-primary text-white px-8 py-4 rounded-[25px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all"
        >
          <Plus size={18} /> Novo Fornecedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-brand-secondary" /></div>
        ) : filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((s) => (
            <div key={s.id} className="bg-white p-6 rounded-[40px] border border-brand-secondary/5 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-brand-primary uppercase">{s.name}</h3>
                  <p className="text-[8px] font-black text-brand-secondary uppercase tracking-widest">{s.category}</p>
                </div>
              </div>

              {s.notes && (
                <p className="text-[9px] text-brand-secondary/70 mb-6 italic leading-relaxed">"{s.notes}"</p>
              )}

              <div className="space-y-2 mt-auto">
                <button 
                  onClick={() => {
                    setSelectedSupplier(s)
                    setShowPurchaseModal(true)
                  }}
                  className="w-full bg-brand-primary text-white py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all text-[9px] font-black uppercase tracking-widest shadow-lg"
                >
                  <Receipt size={14} /> Registrar Compra
                </button>

                <div className="flex items-center gap-2">
                  {s.phone && (
                    <a 
                      href={`https://wa.me/${s.phone.replace(/\D/g, '')}`} 
                      target="_blank" 
                      className="flex-1 bg-rose-50 text-brand-primary py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-all text-[9px] font-bold uppercase"
                    >
                      <Phone size={14} /> Whats
                    </a>
                  )}
                  {s.link && (
                    <a 
                      href={s.link} 
                      target="_blank" 
                      className="flex-1 bg-white border border-brand-secondary/10 text-brand-primary py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-50 transition-all text-[9px] font-bold uppercase"
                    >
                      <ExternalLink size={14} /> Site
                    </a>
                  )}
                </div>
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => openEditModal(s)}
                  className="p-2 text-brand-secondary hover:text-brand-primary transition-all"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteSupplier(s.id)}
                  className="p-2 text-rose-200 hover:text-rose-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center opacity-40">
            <Store className="mx-auto mb-4" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Nenhum fornecedor cadastrado. 💎</p>
          </div>
        )}
      </div>

      {/* 🧾 MODAL DE REGISTRO DE COMPRA (ROMANEIO) */}
      {showPurchaseModal && selectedSupplier && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="p-8 border-b border-brand-secondary/10 flex justify-between items-center bg-rose-50/20">
              <div>
                <h3 className="text-xl font-bold text-brand-primary uppercase">Novo Romaneio</h3>
                <p className="text-[9px] font-black text-brand-secondary uppercase tracking-widest flex items-center gap-2 mt-1">
                  <Store size={12} /> {selectedSupplier.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* 🤖 BOTAO DE MÁGICA IA (FOTO OU PDF) */}
                <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border-2 border-brand-primary text-[9px] font-black uppercase tracking-widest transition-all ${isReadingPhoto ? 'bg-brand-primary/10 opacity-50' : 'hover:bg-brand-primary hover:text-white'}`}>
                   {isReadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <><Sparkles size={14} /> Anexar Foto/PDF</>}
                   <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handlePhotoUpload} disabled={isReadingPhoto} />
                </label>

                <button onClick={() => setShowPurchaseModal(false)} className="p-3 hover:bg-rose-100 rounded-full text-brand-primary transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-rose-50/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-brand-primary/5 p-4 rounded-3xl border border-brand-primary/10 flex items-center gap-4">
                  <Calendar className="text-brand-primary" size={20} />
                  <div className="flex-1">
                    <label className="text-[8px] font-black text-brand-primary uppercase tracking-widest block mb-1">Data da Compra</label>
                    <input 
                      type="date" 
                      className="bg-transparent border-none outline-none text-xs font-bold text-brand-primary w-full"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="bg-brand-primary/5 p-4 rounded-3xl border border-brand-primary/10 flex flex-col justify-center">
                  <p className="text-[8px] font-black text-brand-primary uppercase tracking-widest mb-1 text-center">Instrução 💎</p>
                  <p className="text-[7px] text-brand-secondary font-bold uppercase text-center">Anexe o arquivo ou preencha manualmente abaixo.</p>
                </div>
              </div>

              {purchaseItems.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-[30px] border border-brand-secondary/10 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in fade-in duration-300">
                  <div className="md:col-span-5">
                    <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Item / Produto</label>
                    <div className="relative">
                      <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40" size={14} />
                      <select 
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-rose-50/30 border border-transparent focus:border-brand-secondary outline-none text-[9px] font-bold uppercase appearance-none"
                        value={item.productId || ''}
                        onChange={(e) => {
                          const prodId = e.target.value
                          const prod = products.find(p => p.id === prodId)
                          const newItems = [...purchaseItems]
                          newItems[index] = { ...newItems[index], productId: prodId, name: prod?.name || '' }
                          setPurchaseItems(newItems)
                        }}
                      >
                        <option value="">-- SELECIONE OU DIGITE ABAIXO --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                    {!item.productId && (
                      <input 
                        type="text" 
                        placeholder="NOME DO ITEM PERSONALIZADO..." 
                        className="w-full mt-2 px-5 py-3 rounded-2xl bg-white border border-dashed border-brand-secondary/30 text-[9px] font-bold uppercase outline-none focus:border-brand-primary"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...purchaseItems]
                          newItems[index].name = e.target.value
                          setPurchaseItems(newItems)
                        }}
                      />
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Quantidade</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 rounded-2xl bg-rose-50/30 border border-transparent text-[10px] font-bold text-center"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...purchaseItems]
                        newItems[index].quantity = parseInt(e.target.value) || 0
                        setPurchaseItems(newItems)
                      }}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Custo Unitário (R$)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 rounded-2xl bg-rose-50/30 border border-transparent text-[10px] font-bold text-center"
                      value={item.unitCost}
                      onChange={(e) => {
                        const newItems = [...purchaseItems]
                        newItems[index].unitCost = parseFloat(e.target.value) || 0
                        setPurchaseItems(newItems)
                      }}
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button 
                      onClick={() => {
                        if (purchaseItems.length > 1) {
                          setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
                        }
                      }}
                      className="p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => setPurchaseItems([...purchaseItems, { name: '', quantity: 1, unitCost: 0 }])}
                className="w-full py-4 border-2 border-dashed border-brand-secondary/20 rounded-[30px] text-[8px] font-black uppercase text-brand-secondary hover:bg-brand-secondary/5 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Plus size={14} /> Adicionar mais um item ao romaneio
              </button>
            </div>

            <div className="p-8 border-t border-brand-secondary/10 bg-white flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <p className="text-[8px] font-black text-brand-secondary uppercase tracking-widest">Valor Total do Romaneio</p>
                <h4 className="text-2xl font-bold text-brand-primary">
                  R$ {purchaseItems.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
              </div>
              <button 
                onClick={handleFinishPurchase}
                disabled={isFinishingPurchase}
                className="w-full md:w-auto bg-brand-primary text-white px-12 py-5 rounded-[25px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isFinishingPurchase ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Finalizar & Baixar Romaneio (PDF)</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ MODAL DE ADICIONAR/EDITAR FORNECEDOR */}
      {showAddModal && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-brand-primary uppercase mb-6 text-center">
              {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Nome do Fornecedor</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="EX: ATACADO DAS JOIAS"
                />
              </div>

              <div>
                <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Categoria (O que ele vende?)</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="EX: SEMIJOIAS BANHADAS, EMBALAGENS"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">WhatsApp</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Link do Site</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[7px] font-black text-brand-secondary uppercase tracking-widest block mb-2">Notas Estratégicas</label>
                <textarea 
                  className="w-full px-5 py-3 rounded-2xl bg-rose-50/30 border border-brand-secondary/10 text-[10px] font-bold uppercase outline-none h-20 resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="EX: MELHOR BANHO DE OURO, ENTREGA RÁPIDA"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={closeFormModal}
                className="flex-1 py-4 text-[9px] font-black uppercase text-brand-secondary tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveSupplier}
                disabled={isSaving}
                className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : editingSupplier ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
