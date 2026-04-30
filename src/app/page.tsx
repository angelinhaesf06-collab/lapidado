'use client'

import { useEffect, useState, Suspense, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Gem, Camera, MessageCircle, Music2 } from 'lucide-react'
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
  instagram?: string
  tiktok?: string
  phone?: string
  [key: string]: unknown
}

// 💎 NEXUS: Cache Global para navegação instantânea entre páginas
let globalCache: {
  products: any[],
  categories: any[],
  branding: any | null,
  storeSlug: string | null
} = {
  products: [],
  categories: [],
  branding: null,
  storeSlug: null
};

function HomeContent() {
  const searchParams = useSearchParams()
  const [allProducts, setAllProducts] = useState<any[]>(globalCache.products)
  const [dbCategories, setDbCategories] = useState<Category[]>(globalCache.categories)
  const [branding, setBranding] = useState<Branding | null>(globalCache.branding)
  const [loading, setLoading] = useState(globalCache.products.length === 0)
  
  const storeSlug = searchParams.get('loja')
  const isPublicCatalog = searchParams.get('catalogo') === 'true' || !!storeSlug
  const activeCategory = searchParams.get('category') || 'Todos'
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadInitialData() {
      // Se o slug mudou ou não temos nada em cache, buscamos do zero
      const shouldFetch = globalCache.products.length === 0 || globalCache.storeSlug !== storeSlug;
      
      if (!shouldFetch) {
        setLoading(false);
        return;
      }

      setLoading(true)
      
      try {
        let brandingQuery = supabase.from('branding').select('*')
        
        if (storeSlug) {
          brandingQuery = brandingQuery.eq('slug', storeSlug)
        } else {
          brandingQuery = brandingQuery.eq('slug', 'angel-semijoias')
        }
        
        let { data: currentBranding } = await brandingQuery.maybeSingle()

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

        const [catsRes, prodsRes] = await Promise.all([
          supabase.from('categories').select('id, name').eq('user_id', currentUserId).order('name'),
          supabase.from('products')
            .select('id, name, price, image_url, category_id, stock_quantity')
            .eq('user_id', currentUserId)
            .gt('stock_quantity', 0)
            .order('display_order', { ascending: true, nullsFirst: true })
            .order('created_at', { ascending: false })
            .limit(100)
        ])

        const finalCategories = catsRes.data || []
        const finalProducts = prodsRes.data || []

        // Atualizar estados
        setDbCategories(finalCategories)
        setAllProducts(finalProducts)
        
        // 💎 NEXUS: Salvar no Cache Global para retorno instantâneo
        globalCache = {
          products: finalProducts,
          categories: finalCategories,
          branding: currentBranding,
          storeSlug: storeSlug
        };

      } catch (err) {
        console.error("Erro ao carregar vitrine:", err)
      } finally {
        setLoading(false)
      }
    }

    const checkAccess = async () => {
      if (isPublicCatalog) {
        await loadInitialData()
      } else {
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          router.push('/login')
        } else {
          await loadInitialData()
        }
      }
    }

    checkAccess()
  }, [isPublicCatalog, storeSlug, router, supabase])

  useEffect(() => {
    // Só rola se não estiver no carregamento inicial para não dar 'pulo'
    if (!loading) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeCategory, loading])

  const displayedProducts = useMemo(() => {
    if (!allProducts) return []
    if (activeCategory === 'Todos' || !activeCategory) {
      return allProducts
    }
    return allProducts.filter(p => {
      const cat = dbCategories.find(c => c.id === p.category_id)
      return cat?.name === activeCategory
    })
  }, [allProducts, activeCategory, dbCategories])

  const installments = useMemo(() => {
    try {
      // @ts-ignore
      if (branding?.installments) return parseInt(branding.installments.toString())
      const parts = branding?.facebook?.split('|')
      if (parts && parts[1]) {
        const val = parseInt(parts[1])
        return isNaN(val) ? 10 : val
      }
    } catch (e) {}
    return 10
  }, [branding])

  const categoryNames = ['Todos', ...dbCategories.map(c => c.name)]
  const storeParam = storeSlug ? `&loja=${storeSlug}` : ''

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#fffcfc] animate-in fade-in duration-700">
      
      {/* 💎 HEADER FIXO OTIMIZADO (LOGO + NAVEGAÇÃO UNIFICADOS) */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-brand-secondary/10 shadow-sm">
        <header className="w-full pt-6 pb-2 flex flex-col items-center gap-4">
          {branding?.logo_url && typeof branding.logo_url === 'string' ? (
            <Link href={`/?catalogo=true${storeParam}`} className="relative w-32 h-10 md:w-48 md:h-14 transition-transform hover:scale-105 active:scale-95">
              <Image 
                src={branding.logo_url} 
                alt={branding.store_name || 'Logo'} 
                fill 
                className="object-contain"
                priority
              />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-md">
                  <Gem size={16} />
               </div>
               <h1 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-brand-primary">
                  {branding?.store_name || 'LAPIDADO'}
               </h1>
            </div>
          )}
        </header>

        {/* 🏷️ BARRA DE CATEGORIAS (Fica dentro do sticky) */}
        <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-center gap-2 md:gap-4 items-center">
          {categoryNames.map((cat) => (
            <Link 
              key={cat}
              href={`/?catalogo=true&category=${cat === 'Todos' ? '' : cat}${storeParam}`}
              className={`px-3 py-1.5 md:px-4 md:py-2 transition-all duration-300 font-black text-[8px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] uppercase rounded-full border ${
                activeCategory === cat || (cat === 'Todos' && !activeCategory)
                ? "bg-brand-primary text-white border-brand-primary shadow-lg scale-105" 
                : "text-brand-primary/60 hover:text-brand-primary bg-white border-brand-secondary/10 hover:border-brand-primary/30"
              }`}
            >
              {cat}
            </Link>
          ))}
        </nav>
      </div>

      {branding?.facebook?.split('|')[2] && (
        <div className="w-full bg-brand-primary py-2 px-4 text-center">
          <p className="text-white text-[7px] md:text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">
            ✨ {branding.facebook.split('|')[2]} ✨
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 w-full text-center">
        {loading && allProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-brand-secondary" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40">Carregando Coleção...</p>
          </div>
        ) : (
          <>
            <div className="mb-8 md:mb-16">
              <h2 className="text-lg md:text-2xl font-light tracking-[0.4em] uppercase text-brand-primary mb-4 animate-in slide-in-from-bottom-2 duration-700">
                {activeCategory === 'Todos' || !activeCategory ? 'Nova Coleção' : activeCategory}
              </h2>
              <div className="w-12 h-[1px] bg-brand-secondary/40 mx-auto" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-12 gap-y-10 md:gap-y-24 px-1 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {displayedProducts.map((product) => (
                <div key={product.id} className="group flex flex-col items-center w-full">
                  <Link href={`/product?id=${product.id}&catalogo=true${storeParam}`} className="w-full focus:outline-none">
                    <div className="aspect-[4/5] w-full bg-white rounded-[32px] md:rounded-[50px] overflow-hidden mb-5 shadow-[0_20px_50px_rgba(74,50,46,0.04)] border border-white relative transition-all duration-500 group-hover:shadow-[0_30px_70px_rgba(74,50,46,0.1)] group-hover:-translate-y-2">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover transition-transform duration-[1.5s] group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-secondary/5">
                          <Gem size={32} className="text-brand-secondary/20" />
                        </div>
                      )}
                    </div>
                    
                    <div className="px-1 text-center w-full mb-5">
                      <h4 className="text-[9px] md:text-[12px] font-black tracking-[0.2em] uppercase text-brand-primary mb-2 leading-relaxed transition-colors group-hover:text-brand-secondary truncate px-2">{product.name}</h4>
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] md:text-[20px] font-bold text-brand-primary">
                          R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <p className="text-brand-secondary text-[7px] md:text-[9px] font-black tracking-widest uppercase opacity-40">
                          {installments}x de R$ {(Number(product.price) / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="w-full px-1 md:px-6">
                    <AddToCartButton product={product} />
                  </div>
                </div>
              ))}
            </div>
            
            {displayedProducts.length === 0 && !loading && (
              <div className="py-20">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Nenhum item nesta categoria 💎</p>
              </div>
            )}
          </>
        )}
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
