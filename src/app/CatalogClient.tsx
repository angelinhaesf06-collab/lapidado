'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug, triggerHaptic } from '@/lib/utils'
import Link from 'next/link'
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [logoError, setLogoError] = useState(false)
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

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }))
  }

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    triggerHaptic('light');
    const url = new URL(window.location.href);
    if (cat === 'Todos') {
      url.searchParams.delete('category');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      url.searchParams.set('category', cat);
      // ✨ Scroll Suave Inteligente e Harmonioso
      if (productsTopRef.current) {
        // Busca a altura real do cabeçalho fixo no momento do clique
        const headerElement = document.querySelector('.sticky');
        const headerHeight = headerElement ? headerElement.clientHeight : 150;
        
        // Detecta se é mobile para dar um respiro MUITO maior e evitar sumiço
        const isMobile = window.innerWidth < 768;
        const extraPadding = isMobile ? 80 : 40; 
        
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
              .limit(100)
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
      <div className="flex flex-col w-full min-h-screen animate-pulse bg-[#F5F0E6]">
        {/* Skeleton Header */}
        <div className="w-full pt-12 pb-8 flex flex-col items-center gap-6 border-b border-brand-secondary/5">
          <div className="w-48 h-16 bg-brand-secondary/5 rounded-2xl" />
          <div className="w-64 h-2 bg-brand-secondary/5 rounded-full" />
        </div>

        {/* Skeleton Products Grid */}
        <div className="max-w-7xl mx-auto px-4 py-16 w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-12 gap-y-10 md:gap-y-24">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col items-center w-full">
                <div className="aspect-[4/5] w-full bg-brand-secondary/5 rounded-[32px] md:rounded-[50px] mb-5" />
                <div className="w-3/4 h-3 bg-brand-secondary/5 rounded-full mb-3" />
                <div className="w-1/2 h-4 bg-brand-secondary/5 rounded-full mb-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-700 bg-[#F5F0E6]">
      
      {/* 💎 CABEÇALHO DINÂMICO COMPACTO */}
      <div className="sticky top-0 z-[100] bg-[#F5F0E6]/95 backdrop-blur-xl border-b border-brand-secondary/10 shadow-sm pt-[env(safe-area-inset-top,10px)] overflow-visible">
        <header className="w-full pt-4 pb-2 flex flex-col items-center gap-3">
          {branding?.logo_url && !logoError ? (
            <Link href={`/?catalogo=true${storeParam}`} className="relative block w-32 md:w-48 h-10 md:h-14 transition-all duration-500 hover:scale-105 active:scale-95">
              <img 
                src={branding.logo_url} 
                alt={branding.store_name || 'Logo'} 
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
               <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-md">
                  <Gem size={16} />
               </div>
               <h1 className="text-[10px] md:text-[14px] font-black uppercase tracking-[0.4em] text-brand-primary">
                  {branding?.store_name || 'LAPIDADO'}
               </h1>
            </div>
          )}
          
          {branding?.tagline && (
            <p className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.3em] text-brand-secondary/60 max-w-[80%] text-center leading-relaxed">
              {branding.tagline}
            </p>
          )}
        </header>

        {categoryNames.length > 1 && (
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-center gap-2 md:gap-3 items-center overflow-visible">
            {categoryNames.map((cat) => (
              <button 
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 md:px-4 md:py-2 transition-all duration-300 font-black text-[8px] md:text-[9px] tracking-[0.1em] uppercase rounded-full border ${
                  activeCategory === cat || (cat === 'Todos' && !activeCategory)
                  ? "bg-brand-primary text-white border-brand-primary shadow-md scale-105" 
                  : "text-brand-primary/60 hover:text-brand-primary bg-white/50 border-brand-secondary/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        )}
      </div>

      {(branding?.top_banner ?? branding?.facebook?.split('|')[2]) && (
        <div className="w-full bg-brand-primary py-1 px-4 text-center">
          <p className="text-white text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] break-words">
            ✨ {(branding?.top_banner ?? branding?.facebook?.split('|')[2]) as string} ✨
          </p>
        </div>
      )}

      <div ref={productsTopRef} className="max-w-7xl mx-auto px-4 py-8 md:py-16 w-full text-center overflow-visible pb-32">
        <div className="mb-8 md:mb-16 pt-2">
          <h2 className="text-sm md:text-xl font-light tracking-[0.2em] md:tracking-[0.3em] uppercase text-brand-primary mb-3 animate-in slide-in-from-bottom-2 duration-700 block break-words">
            {(activeCategory === 'Todos' || !activeCategory) 
              ? `${branding?.store_name || 'Coleção'} Exclusiva` 
              : activeCategory}
          </h2>
          <div className="w-8 h-[1px] bg-brand-secondary/30 mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-10 gap-y-8 md:gap-y-20 px-1 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {displayedProducts.map((product, index) => {
            const isBroken = !product.image_url || imageErrors[product.id];
            
            return (
              <div key={product.id} className="group flex flex-col items-center w-full">
                <Link href={`/product?id=${product.id}&catalogo=true${storeParam}`} className="w-full focus:outline-none">
                  <div className="aspect-[4/5] w-full bg-brand-secondary/5 rounded-[32px] md:rounded-[40px] overflow-hidden mb-4 shadow-sm relative transition-all duration-500 group-hover:shadow-md group-hover:-translate-y-1">
                    {!isBroken ? (
                      <img 
                        src={product.image_url} 
                        alt="" 
                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                        loading={index < 8 ? "eager" : "lazy"}
                        onError={() => handleImageError(product.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-20">
                        <Gem size={24} />
                        <span className="text-[7px] font-black uppercase tracking-widest">Sem Foto</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-1 text-center w-full mb-4">
                    <h4 className="text-[9px] md:text-[11px] font-black tracking-[0.1em] uppercase text-brand-primary mb-1 leading-relaxed transition-colors group-hover:text-brand-secondary truncate px-2">{product.name}</h4>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] md:text-[18px] font-bold text-brand-primary">
                        R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <p className="text-brand-secondary text-[7px] md:text-[8px] font-black tracking-widest uppercase opacity-40">
                        {installments}x de R$ {(Number(product.price) / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="w-full px-1 md:px-4">
                  <AddToCartButton product={product} />
                </div>
              </div>
            )
          })}
        </div>
        
        {!loading && displayedProducts.length === 0 && (
          <div className="py-20">
            <Gem size={32} className="text-brand-secondary/20 mb-4 mx-auto" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-secondary/30">Coleção em breve 💎</p>
          </div>
        )}
      </div>
    </div>
  )
}

