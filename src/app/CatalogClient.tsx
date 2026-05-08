'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { generateSlug, triggerHaptic } from '@/lib/utils'
import Image from 'next/image'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Gem } from 'lucide-react'

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
  logo_url?: string
  top_banner?: string
  installments?: number | string
  [key: string]: any
}

export default function CatalogClient({ 
  initialBranding, 
  initialProducts, 
  initialCategories 
}: { 
  initialBranding?: any, 
  initialProducts?: any[], 
  initialCategories?: any[] 
}) {
  const searchParams = useSearchParams()
  const [allProducts, setAllProducts] = useState<any[]>(initialProducts || [])
  const [dbCategories, setDbCategories] = useState<Category[]>(initialCategories || [])
  const [branding, setBranding] = useState<Branding | null>(initialBranding || null)
  const [loading, setLoading] = useState(!initialProducts || initialProducts.length === 0)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const productsTopRef = useRef<HTMLDivElement>(null)
  
  const storeSlug = searchParams.get('loja')
  const isPublicCatalog = searchParams.get('catalogo') === 'true' || !!storeSlug
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    triggerHaptic('light');
    const url = new URL(window.location.href);
    if (cat === 'Todos') {
      url.searchParams.delete('category');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      url.searchParams.set('category', cat);
      // ✨ Scroll Suave Inteligente
      if (productsTopRef.current) {
        // Busca a altura real do cabeçalho fixo no momento do clique
        const headerElement = document.querySelector('.sticky');
        const headerHeight = headerElement ? headerElement.clientHeight : 200;
        
        // Detecta se é mobile para dar um respiro maior
        const isMobile = window.innerWidth < 768;
        const extraPadding = isMobile ? 60 : 20;
        
        const elementPosition = productsTopRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - (headerHeight + extraPadding);

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
    window.history.pushState({}, '', url);
  }

  useEffect(() => {
    async function loadBrandingData() {
      try {
        let currentBranding: Branding | null = null
        
        // 1. Prioridade: Slug da URL (Vitrine de Cliente)
        if (storeSlug) {
          const { data } = await supabase.from('branding').select('*').eq('slug', storeSlug).maybeSingle()
          currentBranding = data as Branding | null
        } 
        
        // 2. Fallback: Usuário logado (Preview da Empresária)
        if (!currentBranding) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase.from('branding').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle()
            currentBranding = data as Branding | null
          }
        }
        
        if (currentBranding) {
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
              .limit(100) // 💎 Aumentado para garantir que todas as joias apareçam
          ])

          if (catsRes.data) setDbCategories(catsRes.data)
          if (prodsRes.data) setAllProducts(prodsRes.data)
        } else if (!storeSlug) {
          // Vitrine Global (sem branding específico)
          const { data: prods } = await supabase.from('products')
            .select('id, name, price, image_url, category_id, stock_quantity')
            .gt('stock_quantity', 0)
            .order('created_at', { ascending: false })
            .limit(100)
          
          if (prods) setAllProducts(prods)
        }
      } catch (err) {
        console.error("Erro ao carregar dados da vitrine:", err)
      } finally {
        setLoading(false)
      }
    }

    loadBrandingData()
  }, [storeSlug, supabase, initialProducts, initialBranding])

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
      const b = branding as any
      if (b?.installments) return parseInt(b.installments.toString())
      const parts = b?.facebook?.split('|')
      if (parts && parts[1]) {
        const val = parseInt(parts[1])
        return isNaN(val) ? 10 : val
      }
    } catch {
      // Erro ignorado
    }
    return 10
  }, [branding])

  const categoryNames = ['Todos', ...dbCategories.map(c => c.name)]
  const storeParam = storeSlug ? `&loja=${storeSlug}` : ''

  if (loading && allProducts.length === 0) {
    return (
      <div className="flex flex-col w-full min-h-screen bg-[#fffcfc] animate-pulse">
        {/* Skeleton Header */}
        <div className="w-full pt-12 pb-8 flex flex-col items-center gap-6 border-b border-brand-secondary/5 bg-white">
          <div className="w-48 h-16 bg-brand-secondary/5 rounded-2xl" />
          <div className="w-64 h-2 bg-brand-secondary/5 rounded-full" />
          <div className="flex gap-3 mt-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-16 h-8 bg-brand-secondary/5 rounded-full" />
            ))}
          </div>
        </div>

        {/* Skeleton Products Grid */}
        <div className="max-w-7xl mx-auto px-4 py-16 w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-12 gap-y-10 md:gap-y-24">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col items-center w-full">
                <div className="aspect-[4/5] w-full bg-brand-secondary/5 rounded-[32px] md:rounded-[50px] mb-5 shadow-sm" />
                <div className="w-3/4 h-3 bg-brand-secondary/5 rounded-full mb-3" />
                <div className="w-1/2 h-4 bg-brand-secondary/5 rounded-full mb-4" />
                <div className="w-full h-12 bg-brand-secondary/5 rounded-[20px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#fffcfc] animate-in fade-in duration-700">
      
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-brand-secondary/10 shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <header className="w-full pt-8 pb-4 flex flex-col items-center gap-6">
          {branding?.logo_url ? (
            <Link href={`/?catalogo=true${storeParam}`} className="relative w-40 h-14 md:w-64 md:h-20 transition-all duration-500 hover:scale-110 active:scale-95">
              <Image 
                src={branding.logo_url} 
                alt={branding.store_name || 'Logo'} 
                fill 
                className="object-contain filter drop-shadow-sm"
                priority
              />
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-3">
               <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/20">
                  <Gem size={24} />
               </div>
               <h1 className="text-[12px] md:text-[16px] font-black uppercase tracking-[0.6em] text-brand-primary">
                  {branding?.store_name || 'LAPIDADO'}
               </h1>
            </div>
          )}
          
          {branding?.tagline && (
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-brand-secondary/60 max-w-[80%] text-center leading-relaxed">
              {branding.tagline}
            </p>
          )}
        </header>

        {categoryNames.length > 1 && (
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-center gap-2 md:gap-4 items-center">
            {categoryNames.map((cat) => (
              <button 
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 md:px-4 md:py-2 transition-all duration-300 font-black text-[8px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] uppercase rounded-full border ${
                  activeCategory === cat || (cat === 'Todos' && !activeCategory)
                  ? "bg-brand-primary text-white border-brand-primary shadow-lg scale-105" 
                  : "text-brand-primary/60 hover:text-brand-primary bg-white border-brand-secondary/10 hover:border-brand-primary/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        )}
      </div>

      {(branding?.top_banner || (branding?.facebook && branding.facebook.includes('|') && branding.facebook.split('|')[2])) && (
        <div className="w-full bg-brand-primary py-2 px-4 text-center">
          <p className="text-white text-[7px] md:text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">
            ✨ {(branding?.top_banner || branding?.facebook?.split('|')[2]) as string} ✨
          </p>
        </div>
      )}

      <div ref={productsTopRef} className="max-w-7xl mx-auto px-4 py-8 md:py-16 w-full text-center">
        <div className="mb-8 md:mb-16">
          <h2 className="text-lg md:text-2xl font-light tracking-[0.4em] uppercase text-brand-primary mb-4 animate-in slide-in-from-bottom-2 duration-700">
            {activeCategory === 'Todos' || !activeCategory ? `${branding?.store_name || 'Coleção'} Exclusiva` : activeCategory}
          </h2>
          <div className="w-12 h-[1px] bg-brand-secondary/40 mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-12 gap-y-10 md:gap-y-24 px-1 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {displayedProducts.map((product, index) => (
            <div key={product.id} className="group flex flex-col items-center w-full">
              <Link href={`/product?id=${product.id}&catalogo=true${storeParam}`} className="w-full focus:outline-none">
                <div className="aspect-[4/5] w-full bg-white rounded-[32px] md:rounded-[50px] overflow-hidden mb-5 shadow-[0_20px_50px_rgba(74,50,46,0.04)] border border-white relative transition-all duration-500 group-hover:shadow-[0_30px_70px_rgba(74,50,46,0.1)] group-hover:-translate-y-2">
                  {product.image_url ? (
                    <Image 
                      src={product.image_url} 
                      alt={product.name} 
                      fill 
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                      priority={index < 8}
                    />
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
        
        {!loading && displayedProducts.length === 0 && (
          <div className="py-20">
            <Gem size={48} className="text-brand-secondary/20 mb-6 mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Nenhum item disponível no momento 💎</p>
          </div>
        )}
      </div>
    </div>
  )
}
