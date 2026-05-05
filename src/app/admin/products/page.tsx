'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Pencil, Image as ImageIcon, Loader2, ArrowLeft, Gem, Share2, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  image_url: string | null;
  stock_quantity: number;
  category_id: string;
  categories: { name: string } | null;
  material_finish?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [branding, setBranding] = useState<any>(null)
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 12

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  const loadData = useCallback(async (isInitial = true) => {
    if (isInitial) setLoading(true)
    else setLoadingMore(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const currentPage = isInitial ? 0 : page + 1
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const [prodRes, catRes, brandRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, price, cost_price, image_url, stock_quantity, category_id, material_finish, categories(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to),
      isInitial ? supabase.from('categories').select('id, name').order('name') : Promise.resolve({ data: null }),
      isInitial ? supabase.from('branding').select('*').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null })
    ])

    if (prodRes.data) {
      if (isInitial) {
        setProducts(prodRes.data as unknown as Product[])
        setPage(0)
      } else {
        setProducts(prev => [...prev, ...(prodRes.data as unknown as Product[])])
        setPage(currentPage)
      }
      setHasMore(prodRes.data.length === PAGE_SIZE)
    }

    if (isInitial) {
      if (catRes.data) setCategories(catRes.data)
      if (brandRes.data) setBranding(brandRes.data)
      setLoading(false)
    } else {
      setLoadingMore(false)
    }
  }, [supabase, page])

  useEffect(() => {
    loadData(true)
  }, [])

  const handleShareWhatsApp = (product: Product) => {
    const storeName = branding?.business_name || branding?.store_name || 'LAPIDADO'
    const baseUrl = branding?.website || window.location.origin
    
    // ⚠️ Alerta se estiver tentando compartilhar localhost sem ter link oficial
    if (!branding?.website && window.location.hostname === 'localhost') {
      alert('ATENÇÃO: Você está compartilhando um link de "localhost". Configure o "Link Oficial da Vitrine" em "Minha Marca" para que seus clientes consigam acessar! 💎')
    }

    const msg = encodeURIComponent(`OLÁ! ✨ OLHA QUE LINDA ESSA JOIA DA *${storeName.toUpperCase()}*:\n\n💍 *${product.name}*\n💎 VALOR: R$ ${Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nCONFIRA MAIS DETALHES AQUI: ${baseUrl}/product?id=${product.id}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'Todas' || p.categories?.name === activeCategory
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [products, activeCategory, searchQuery])

  const handleDelete = async (id: string, imageUrl: string | null) => {
    if (!confirm('TEM CERTEZA QUE DESEJA REMOVER ESTA JOIA DA VITRINE? 💎')) return
    
    setDeletingId(id)
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer LAPIDADO_ADMIN_2026'
        },
        body: JSON.stringify({ table: 'products', id, imageUrl })
      })
      
      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      alert('ERRO AO EXCLUIR: ' + err.message.toUpperCase())
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 pb-20">
      <div className="mb-8 md:mb-12">
        <Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em] mb-4 hover:ml-2 transition-all">
          <ArrowLeft size={14} /> Voltar ao Painel
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight uppercase text-brand-primary">Gestão do Acervo</h2>
            <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Administre suas joias com elegância 💎</p>
          </div>
          
          <Link href="/admin/products/new" className="bg-brand-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-center">
            + Nova Joia
          </Link>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-secondary/40" size={18} />
          <input 
            type="text" 
            placeholder="PESQUISAR JOIA PELO NOME..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-rose-100 bg-white text-[10px] font-bold tracking-widest text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all placeholder:text-brand-secondary/20"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <button 
            onClick={() => setActiveCategory('Todas')}
            className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeCategory === 'Todas' ? 'bg-brand-primary border-brand-primary text-white shadow-md' : 'bg-white border-brand-secondary/10 text-brand-secondary/40'}`}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeCategory === cat.name ? 'bg-brand-primary border-brand-primary text-white shadow-md' : 'bg-white border-brand-secondary/10 text-brand-secondary/40'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-brand-secondary" size={40} />
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Carregando Acervo...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const margin = product.cost_price > 0 
                ? ((product.price - product.cost_price) / product.cost_price * 100).toFixed(0) 
                : '0'

              return (
                <div key={product.id} className="bg-white rounded-[40px] border border-brand-secondary/5 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                  {/* IMAGEM E AÇÕES RÁPIDAS */}
                  <div className="aspect-square relative overflow-hidden bg-brand-secondary/5">
                    {product.image_url ? (
                      <Image 
                        src={product.image_url} 
                        alt={product.name} 
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-secondary/20">
                        <ImageIcon size={48} />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                       <Link 
                        href={`/admin/products/edit?id=${product.id}`} 
                        className="p-4 bg-white rounded-full text-brand-primary hover:scale-110 transition-all shadow-lg"
                       >
                         <Pencil size={20} />
                       </Link>
                       <button 
                        onClick={() => handleShareWhatsApp(product)}
                        className="p-4 bg-[#25D366] rounded-full text-white hover:scale-110 transition-all shadow-lg"
                       >
                         <Share2 size={20} />
                       </button>
                       <button 
                        onClick={() => handleDelete(product.id, product.image_url)}
                        disabled={deletingId === product.id}
                        className="p-4 bg-white rounded-full text-rose-500 hover:scale-110 transition-all shadow-lg"
                       >
                         {deletingId === product.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                       </button>
                    </div>

                    {/* BADGE DE ESTOQUE */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-brand-secondary/10">
                      <p className="text-[8px] font-black text-brand-primary uppercase">{product.stock_quantity} em estoque</p>
                    </div>
                  </div>

                  {/* INFORMAÇÕES */}
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-[8px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-1">{product.categories?.name || 'Joia'}</p>
                      <h3 className="text-sm font-bold text-brand-primary uppercase truncate">{product.name}</h3>
                      {product.material_finish && (
                        <p className="text-[7px] font-bold text-brand-secondary/60 uppercase mt-1 tracking-widest">{product.material_finish}</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-brand-secondary/5 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-brand-secondary/40 uppercase tracking-widest">Preço Venda</p>
                        <p className="text-base font-black text-brand-primary">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[7px] font-black text-amber-700/60 uppercase tracking-widest">Lucro / Margem</p>
                        <p className="text-[10px] font-bold text-amber-700">+{margin}% de Lucro</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {hasMore && (
            <div className="flex justify-center mt-12">
              <button 
                onClick={() => loadData(false)}
                disabled={loadingMore}
                className="px-10 py-4 bg-white border border-brand-primary text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-md flex items-center gap-3"
              >
                {loadingMore ? <Loader2 className="animate-spin" size={16} /> : "Carregar mais joias"}
              </button>
            </div>
          )}
        </>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-20 bg-brand-secondary/5 rounded-[40px] border border-dashed border-brand-secondary/10">
          <Gem className="mx-auto text-brand-secondary/20 mb-4" size={40} />
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Nenhuma joia encontrada no seu acervo.</p>
        </div>
      )}
    </div>
  )
}
