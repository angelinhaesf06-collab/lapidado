'use client'

import { useEffect, useState, Suspense, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Gem } from 'lucide-react'
import { CartItem } from '@/lib/cart-context'

interface Category {
  id: string
  name: string
}

interface Branding {
  id: string
  user_id: string
  slug: string
  store_name: string
  facebook?: string
  [key: string]: unknown
}

function HomeContent() {
  const searchParams = useSearchParams()
  const [allProducts, setAllProducts] = useState<CartItem[]>([])
  const [dbCategories, setDbCategories] = useState<Category[]>([])
  const [branding, setBranding] = useState<Branding | null>(null)
  const [loading, setLoading] = useState(true)
  
  const isPublicCatalog = searchParams.get('catalogo') === 'true'
  const storeSlug = searchParams.get('loja')
  const activeCategory = searchParams.get('category') || 'Todos'
  const supabase = createClient()
  const router = useRouter()

  // 1. CARREGAMENTO INICIAL (OTIMIZADO)
  useEffect(() => {
    if (!isPublicCatalog) {
      router.push('/login')
      return
    }

    async function loadInitialData() {
      if (allProducts.length > 0) return
      setLoading(true)
      
      try {
        // 🚀 OTIMIZAÇÃO: Busca branding com lógica de fallback em uma única query ou mínima latência
        let brandingQuery = supabase.from('branding').select('*')
        
        if (storeSlug) {
          brandingQuery = brandingQuery.eq('slug', storeSlug)
        } else {
          brandingQuery = brandingQuery.eq('slug', 'angel-semijoias')
        }
        
        let { data: currentBranding } = await brandingQuery.maybeSingle()

        // Fallback final se não achou nada
        if (!currentBranding) {
          const { data: firstBrand } = await supabase.from('branding').select('*').limit(1).maybeSingle()
          currentBranding = firstBrand
        }

        if (!currentBranding) {
          setLoading(false)
          return
        }

        setBranding(currentBranding)
        const currentUserId = currentBranding.user_id

        // 🚀 OTIMIZAÇÃO: Busca categorias e apenas os campos essenciais dos produtos
        // Carregamos um limite inicial para ser instantâneo
        const [catsRes, prodsRes] = await Promise.all([
          supabase.from('categories').select('id, name').eq('user_id', currentUserId).order('name'),
          supabase.from('products')
            .select('id, name, price, image_url, category_id, stock_quantity, categories!inner(name)')
            .eq('user_id', currentUserId)
            .gt('stock_quantity', 0)
            .order('created_at', { ascending: false })
            .limit(40) // Limite de segurança para vitrine rápida
        ])

        setDbCategories(catsRes.data || [])
        setAllProducts(prodsRes.data || [])
      } catch (err) {
        console.error("Erro ao carregar vitrine:", err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [isPublicCatalog, storeSlug, router, supabase, allProducts.length])

  // 2. SCROLL PARA O TOPO QUANDO MUDAR CATEGORIA
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeCategory])

  // 3. FILTRAGEM ULTRA-RÁPIDA (Em memória, sem loading)
  const displayedProducts = useMemo(() => {
    if (activeCategory === 'Todos' || !activeCategory) {
      return allProducts
    }
    return allProducts.filter(p => 
      // @ts-ignore - categories é injetado pelo join !inner
      p.categories?.name === activeCategory
    )
  }, [allProducts, activeCategory])

  if (loading && allProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-secondary" size={40} />
      </div>
    )
  }

  const categoryNames = ['Todos', ...dbCategories.map(c => c.name)]
  
  // 💎 NEXUS: Lógica de Parcelas Inteligente (Sincronizada com Carrinho)
  const installments = useMemo(() => {
    if (branding?.installments) return parseInt(branding.installments.toString())
    const parts = branding?.facebook?.split('|')
    if (parts && parts[1]) {
      const val = parseInt(parts[1])
      return isNaN(val) ? 10 : val
    }
    return 10
  }, [branding])

  const storeParam = storeSlug ? `&loja=${storeSlug}` : ''

  return (
    <div className="flex flex-col w-full min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md border-b border-brand-secondary/10 sticky top-[56px] md:top-[72px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 py-2 md:py-3 flex flex-wrap justify-center gap-2 md:gap-6 min-h-[40px] items-center">
          {dbCategories.length > 0 ? (
            categoryNames.map((cat) => (
              <Link 
                key={cat}
                href={`/?catalogo=true&category=${cat === 'Todos' ? '' : cat}${storeParam}`}
                className={`px-3 py-1.5 transition-all font-bold text-[9px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] uppercase rounded-full border ${
                  activeCategory === cat || (cat === 'Todos' && !activeCategory)
                  ? "bg-brand-primary text-white border-brand-primary shadow-md" 
                  : "text-brand-primary/70 hover:text-brand-primary bg-brand-secondary/5 border-brand-secondary/10"
                }`}
              >
                {cat}
              </Link>
            ))
          ) : (
            <div className="flex items-center gap-3 px-4 py-1">
              <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-brand-primary/40">
                Coleções Exclusivas
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* 🎀 BANNER DE TOPO DINÂMICO */}
      {branding?.facebook?.split('|')[2] && (
        <div className="w-full bg-brand-primary py-3 px-4 text-center">
          <p className="text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em]">
            ✨ {branding.facebook.split('|')[2]} ✨
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 w-full text-center">
        <div className="mb-8 md:mb-16">
          <h2 className="text-xl md:text-2xl font-light tracking-[0.2em] uppercase text-brand-primary mb-2">
            {activeCategory === 'Todos' ? (branding?.store_name || 'Coleção Completa') : activeCategory}
          </h2>
          <div className="w-12 h-[1px] bg-brand-secondary/30 mx-auto mb-2" />
          <p className="text-brand-secondary text-[8px] md:text-[9px] font-bold tracking-[0.2em] uppercase opacity-60">
            {displayedProducts.length} Itens Selecionados {branding?.store_name && `por ${branding.store_name}`}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-10 gap-y-10 md:gap-y-20 px-1">
          {displayedProducts.length > 0 ? (
            displayedProducts.map((product, index) => (
              <div key={product.id} className="group flex flex-col items-center">
                <Link href={`/product?id=${product.id}&catalogo=true${storeParam}`} className="w-full">
                  <div className="aspect-[4/5] w-full bg-white rounded-[40px] md:rounded-[64px] overflow-hidden mb-6 md:mb-10 shadow-[0_20px_60px_rgba(74,50,46,0.08)] border border-white relative transition-all duration-700">
                    {product.image_url ? (
                      <Image 
                        src={product.image_url} 
                        alt={product.name} 
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                        priority={index < 4}
                        loading={index < 4 ? "eager" : "lazy"}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-secondary/5">
                        <Gem size={32} className="text-brand-secondary/20" />
                      </div>
                    )}
                  </div>
                  
                  <div className="px-4 text-center w-full mb-8">
                    <h4 className="text-[10px] md:text-[13px] font-black tracking-[0.2em] md:tracking-[0.4em] uppercase text-brand-primary mb-2 w-full leading-relaxed">{product.name}</h4>
                    <div className="flex flex-col gap-1 md:gap-3">
                      <span className="text-[14px] md:text-[22px] font-bold text-brand-primary">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <p className="text-brand-secondary text-[8px] md:text-[10px] font-black tracking-widest uppercase opacity-60">
                        {installments}x de R$ {(product.price / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="w-full max-w-[140px] md:max-w-none px-2 md:px-6 flex flex-col items-center gap-4">
                  <AddToCartButton product={product} />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-brand-primary/60 font-light tracking-widest uppercase">Nenhuma joia encontrada. 💎</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>}>
      <HomeContent />
    </Suspense>
  )
}
