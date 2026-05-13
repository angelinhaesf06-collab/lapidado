'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Pencil, Image as ImageIcon, Loader2, ArrowLeft, Gem, Share2, Plus, Search, GripVertical, Check, X, Move } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  image_url: string | null;
  stock_quantity: number;
  category_id: string;
  display_order?: number;
  categories: { name: string } | null;
  material_finish?: string;
}

interface Category {
  id: string;
  name: string;
}

// 💎 COMPONENTE DE ITEM ORDENÁVEL
function SortableProduct({ product, margin, deletingId, handleDelete, handleShareWhatsApp, isSorting }: any) {
  const [imageError, setImageError] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: product.id, disabled: !isSorting })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
    touchAction: isSorting ? 'none' : 'auto', // 💎 Importante para mobile
  }

  const hasValidImage = product.image_url && 
                        product.image_url.length > 5 &&
                        product.image_url !== 'undefined' && 
                        product.image_url !== 'null' &&
                        !imageError

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`bg-white rounded-[40px] border border-brand-secondary/5 overflow-hidden shadow-sm hover:shadow-xl transition-all group ${isSorting ? 'ring-2 ring-brand-primary/20 cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* IMAGEM E AÇÕES RÁPIDAS */}
      <div className="aspect-square relative overflow-hidden bg-brand-secondary/5">
        {hasValidImage ? (
          <Image 
            src={product.image_url} 
            alt={product.name}
            className="object-cover group-hover:scale-110 transition-transform duration-700" 
            fill
            priority={false}
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={(e) => {
              console.error("Erro ao carregar imagem no admin:", product.image_url);
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-brand-secondary/10 gap-2 bg-brand-secondary/5">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-brand-secondary/20 flex items-center justify-center">
              <span className="text-xl">💎</span>
            </div>
            <p className="text-[7px] font-black uppercase tracking-widest opacity-40">Sem Foto</p>
          </div>
        )}
        
        {isSorting ? (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-primary/40 backdrop-blur-[2px]" {...attributes} {...listeners}>
            <div className="bg-white p-4 rounded-full shadow-2xl animate-pulse">
              <Move size={32} className="text-brand-primary" />
            </div>
            <p className="absolute bottom-6 text-[8px] font-black text-white uppercase tracking-widest">Arraste para mover</p>
          </div>
        ) : (
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
        )}

        {/* BADGE DE ESTOQUE */}
        {!isSorting && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-brand-secondary/10">
            <p className="text-[8px] font-black text-brand-primary uppercase">{product.stock_quantity} em estoque</p>
          </div>
        )}
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
}

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [branding, setBranding] = useState<any>(null)
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isSorting, setIsSorting] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 100 // No modo reorder aumentamos para ver mais

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // Evita drag acidental no clique
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 15 } }), // Suporte a toque (segurar 250ms, mais tolerância)
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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
        .select('id, name, price, cost_price, image_url, stock_quantity, category_id, material_finish, display_order, categories(name)')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true, nullsFirst: true }) // 💎 Agora ordenamos pela ordem definida, nulos no topo
        .order('created_at', { ascending: false })
        .range(from, to),
      isInitial ? supabase.from('categories').select('id, name').eq('user_id', user.id).order('name') : Promise.resolve({ data: null }),
      isInitial ? supabase.from('branding').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null })
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
  }, [loadData])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const saveNewOrder = async () => {
    setIsSavingOrder(true)
    try {
      // 💎 LÓGICA DE SALVAMENTO INTELIGENTE
      // Se estivermos em uma categoria específica, mantemos a ordem dos outros produtos
      // e apenas encaixamos a nova ordem da categoria atual.
      
      let finalOrder: { id: string, display_order: number }[] = []
      
      // Como o 'setProducts' já foi atualizado pelo 'handleDragEnd', 
      // basta mapear a lista completa atual do estado para salvar a nova ordem global.
      finalOrder = products.map((p, index) => ({
        id: p.id,
        display_order: index + 1
      }))

      const res = await fetch('/api/admin/reorder', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ table: 'products', items: finalOrder })
      })

      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      alert(`ORDEM DE ${activeCategory.toUpperCase()} SALVA COM SUCESSO! 💎`)
      setIsSorting(false)
    } catch (err: any) {
      alert('ERRO AO SALVAR ORDEM: ' + err.message.toUpperCase())
    } finally {
      setIsSavingOrder(false)
    }
  }

  const handleShareWhatsApp = (product: Product) => {
    const storeName = branding?.business_name || branding?.store_name || 'LAPIDADO'
    // 💎 Fallback para slug caso esteja nulo no banco
    const storeSlug = branding?.slug || storeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    
    // 🔗 Prioriza o link oficial cadastrado, depois a URL de ambiente, por fim a origem atual
    const baseUrl = branding?.website || process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    
    if (!storeSlug || storeSlug === 'lapidado') {
      return alert('💎 ANGELA, O NOME DA SUA LOJA AINDA NÃO FOI CONFIGURADO.\n\nPor favor, vá em "MINHA MARCA", digite o NOME DA LOJA (diferente de LAPIDADO) e clique em SALVAR. Isso criará o seu link exclusivo para que você possa compartilhar suas joias! ✨')
    }

    // ⚠️ Alerta se estiver tentando compartilhar localhost sem ter link oficial ou variável de ambiente
    if (!branding?.website && !process.env.NEXT_PUBLIC_SITE_URL && window.location.hostname === 'localhost') {
      alert('ATENÇÃO: Você está compartilhando um link de "localhost". Configure o "Link Oficial da Vitrine" em "Minha Marca" para que seus clientes consigam acessar! 💎')
    }

    const storeParam = `&loja=${storeSlug}`
    const msg = encodeURIComponent(`OLÁ! ✨ OLHA QUE LINDA ESSA JOIA DA *${storeName.toUpperCase()}*:\n\n💍 *${product.name}*\n💎 VALOR: R$ ${Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nCONFIRA MAIS DETALHES AQUI: ${baseUrl}/product?id=${product.id}&catalogo=true${storeParam}`)
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
          
          <div className="flex flex-wrap gap-3">
            {!isSorting ? (
              <>
                <button 
                  onClick={() => setIsSorting(true)}
                  className="bg-brand-secondary/10 text-brand-primary px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-secondary/20 transition-all flex items-center gap-2"
                >
                  <Move size={16} /> Organizar Vitrine
                </button>
                <Link href="/admin/products/new" className="bg-brand-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-center">
                  + Nova Joia
                </Link>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setIsSorting(false); loadData(true); }}
                  className="bg-rose-50 text-rose-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-100 transition-all flex items-center gap-2"
                >
                  <X size={16} /> Cancelar
                </button>
                <button 
                  onClick={saveNewOrder}
                  disabled={isSavingOrder}
                  className="bg-green-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSavingOrder ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} 
                  Salvar Nova Ordem
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="mb-8 space-y-4">
        {!isSorting && (
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
        )}

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

      {isSorting && (
        <div className="mb-8 p-6 bg-brand-primary/5 rounded-[30px] border border-brand-primary/10 text-center space-y-2">
          <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">
            💎 MODO ORGANIZAÇÃO ATIVO
          </p>
          <p className="text-[8px] font-bold text-brand-secondary/60 uppercase tracking-widest">
            {activeCategory === 'Todas' 
              ? 'Dica: Filtre por categoria para organizar grupos específicos mais rápido.' 
              : `Organizando apenas: ${activeCategory.toUpperCase()}`}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-brand-secondary" size={40} />
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Carregando Acervo...</p>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <SortableContext 
            items={filteredProducts.map(p => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                let lastCategory = '';
                return filteredProducts.map((product) => {
                  const currentCategory = product.categories?.name || 'Geral';
                  const showHeader = activeCategory === 'Todas' && currentCategory !== lastCategory;
                  lastCategory = currentCategory;

                  const marginValue = product.cost_price > 0 
                    ? ((product.price - product.cost_price) / product.cost_price * 100).toFixed(0) 
                    : '0'

                  return (
                    <Fragment key={product.id}>
                      {showHeader && (
                        <div className="col-span-full mt-8 mb-2 flex items-center gap-4">
                          <div className="h-[1px] flex-1 bg-brand-primary/10"></div>
                          <h3 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] bg-brand-primary/5 px-4 py-2 rounded-full">
                            {currentCategory}
                          </h3>
                          <div className="h-[1px] flex-1 bg-brand-primary/10"></div>
                        </div>
                      )}
                      <SortableProduct 
                        product={product} 
                        margin={marginValue}
                        deletingId={deletingId}
                        handleDelete={handleDelete}
                        handleShareWhatsApp={handleShareWhatsApp}
                        isSorting={isSorting}
                      />
                    </Fragment>
                  )
                })
              })()}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!isSorting && hasMore && (
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

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-20 bg-brand-secondary/5 rounded-[40px] border border-dashed border-brand-secondary/10">
          <Gem className="mx-auto text-brand-secondary/20 mb-4" size={40} />
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Nenhuma joia encontrada no seu acervo.</p>
        </div>
      )}
    </div>
  )
}
