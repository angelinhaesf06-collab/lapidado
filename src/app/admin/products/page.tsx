'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Pencil, Image as ImageIcon, Loader2, ArrowLeft, Gem, Share2, Camera, Filter } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  category_id: string;
  categories: { name: string } | null;
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
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 12 // Carrega 12 joias por vez para ser instantâneo

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

    // 💎 NEXUS: Busca paralela e paginada
    const [prodRes, catRes, brandRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, price, image_url, stock_quantity, category_id, categories(name)')
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
  }, []) // Dependência vazia para carregar apenas no início

  // ... (keep filter and other logic)

  const handleShareWhatsApp = (product: Product) => {
    const storeName = branding?.business_name || branding?.store_name || 'LAPIDADO'
    const msg = encodeURIComponent(`OLÁ! ✨ OLHA QUE LINDA ESSA JOIA DA *${storeName.toUpperCase()}*:\n\n💍 *${product.name}*\n💎 VALOR: R$ ${Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nCONFIRA MAIS DETALHES AQUI: ${window.location.origin}/product?id=${product.id}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  // ⚡ FILTRAGEM INSTANTÂNEA EM MEMÓRIA
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Todas') return products
    return products.filter(p => p.categories?.name === activeCategory)
  }, [products, activeCategory])

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
      alert('JOIA REMOVIDA COM SUCESSO! ✨')
    } catch (err: unknown) {
      alert('ERRO AO EXCLUIR: ' + (err as Error).message.toUpperCase())
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-4 hover:ml-2 transition-all">
            <ArrowLeft size={14} /> Voltar ao Painel
          </Link>
          <h1 className="text-3xl font-bold text-brand-primary uppercase tracking-tight flex items-center gap-3">
            <Gem className="text-brand-secondary" /> Gestão da Vitrine
          </h1>
        </div>
        <Link href="/admin/products/new" className="px-8 py-4 bg-brand-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary transition-all shadow-lg text-center">
          Nova Peça
        </Link>
      </div>

      {/* 💎 BARRA DE CATEGORIAS */}
      <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide mb-4">
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-brand-secondary" size={40} />
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Carregando Acervo...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-[40px] border border-brand-secondary/10 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative">
                {/* Imagem do Produto */}
                <div className="aspect-square relative overflow-hidden bg-brand-secondary/5">
                  {product.image_url ? (
                    <Image 
                      src={product.image_url} 
                      alt={product.name} 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-secondary/30">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  
                  {/* Overlay de Ações */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <button 
                      onClick={() => handleDelete(product.id, product.image_url)}
                      disabled={deletingId === product.id}
                      className="p-4 bg-white rounded-full text-red-500 hover:scale-110 transition-all shadow-lg"
                      title="Excluir"
                     >
                       {deletingId === product.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                     </button>
                     
                     <Link 
                      href={`/admin/products/edit?id=${product.id}`} 
                      className="p-4 bg-white rounded-full text-brand-primary hover:scale-110 transition-all shadow-lg"
                      title="Editar"
                     >
                       <Pencil size={20} />
                     </Link>

                     <button 
                      onClick={() => handleShareWhatsApp(product)}
                      className="p-4 bg-[#25D366] rounded-full text-white hover:scale-110 transition-all shadow-lg"
                      title="WhatsApp"
                     >
                       <Share2 size={20} />
                     </button>
                  </div>
                </div>

                {/* Info do Produto */}
                <div className="p-6">
                  <p className="text-[8px] font-black text-brand-secondary uppercase tracking-widest mb-1">{product.categories?.name || 'SEM CATEGORIA'}</p>
                  <h3 className="text-lg font-bold text-brand-primary uppercase mb-2 line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-black text-brand-primary">R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-[10px] font-bold text-brand-secondary bg-brand-secondary/10 px-3 py-1 rounded-full">{product.stock_quantity} PÇS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center mt-12">
              <button 
                onClick={() => loadData(false)}
                disabled={loadingMore}
                className="px-10 py-4 bg-white border-2 border-brand-primary text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-md flex items-center gap-3"
              >
                {loadingMore ? <Loader2 className="animate-spin" size={16} /> : "Ver mais joias"}
              </button>
            </div>
          )}
        </>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-20 bg-brand-secondary/5 rounded-[60px] border border-dashed border-brand-secondary/10">
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">A vitrine está vazia. Comece a brilhar!</p>
        </div>
      )}
    </div>
  )
}
