'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug, triggerHaptic } from '@/lib/utils'
import Link from 'next/link'
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
        const headerHeight = headerElement ? headerElement.clientHeight : 100;
        
        // Detecta se é mobile para um ajuste preciso
        const isMobile = window.innerWidth < 768;
        const extraPadding = isMobile ? 40 : 20; 
        
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
      if (initialBranding && initialProducts) {
        setLoading(false);
        return;
      }
      
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
            const { data } = await supabase.from('branding').select('*').eq('user_id', user.id).maybeSingle()
            currentBranding = data as Branding | null
          }
        }
        
        if (currentBranding) {
          setBranding(currentBranding)
          
          // 💎 Injeta cores dinâmicas imediatamente para evitar "pulo" visual
          if (typeof document !== 'undefined') {
            document.body.style.setProperty('--brand-primary', currentBranding.primary_color || '#4a322e');
            document.body.style.setProperty('--brand-secondary', currentBranding.secondary_color || '#c99090');
          }

          const currentUserId = currentBranding.user_id

          // 🚀 Carregamento Paralelo Ultra-Rápido e Completo
          const [catsRes, prodsRes] = await Promise.all([
            supabase.from('categories').select('id, name').eq('user_id', currentUserId).order('name'),
            supabase.from('products')
              .select('id, name, price, image_url, category_id, stock_quantity')
              .eq('user_id', currentUserId)
              .gt('stock_quantity', 0)
              .order('display_order', { ascending: true, nullsFirst: true })
              .limit(200) // Limite aumentado para garantir que nenhuma categoria fique vazia
          ])

          if (catsRes.data) setDbCategories(catsRes.data)
          if (prodsRes.data) setAllProducts(prodsRes.data)
        }
      } catch (err) {
        console.error("❌ Falha no carregamento acelerado:", err)
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
    <div className="flex flex-col w-full min-h-[100svh] animate-in fade-in duration-700 bg-[#F5F0E6]">
      
      {/* 💎 CABEÇALHO DINÂMICO COMPACTO COM SAFE AREA */}
      <div className="sticky top-0 z-[100] bg-[#F5F0E6]/95 backdrop-blur-xl border-b border-brand-secondary/5 pt-[env(safe-area-inset-top,8px)] flex flex-col">
        <header className="w-full pt-4 pb-2 flex flex-col items-center gap-3">
          {branding?.logo_url && !logoError ? (
            <Link href={`/?catalogo=true${storeParam}`} className="relative block w-32 md:w-56 h-auto transition-all duration-500 hover:scale-105 active:scale-95">
              <img 
                src={branding.logo_url} 
                alt={branding.store_name || 'Logo'} 
                className="w-full h-full object-contain max-h-16 md:max-h-40"
                onError={() => setLogoError(true)}
              />
            </Link>
          ) : null}
        </header>

        {categoryNames.length > 1 && (
          <nav className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap justify-center gap-1.5 md:gap-3 items-center pb-4">
            {categoryNames.map((cat) => (
              <button 
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 md:px-4 md:py-2 transition-all duration-300 font-black text-[7px] md:text-[9px] tracking-[0.1em] uppercase rounded-full border ${
                  activeCategory === cat || (cat === 'Todos' && !activeCategory)
                  ? "bg-brand-primary text-white border-brand-primary shadow-sm scale-105" 
                  : "text-brand-primary/60 hover:text-brand-primary bg-white/40 border-brand-secondary/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        )}
      </div>

      {branding?.top_banner && (
        <div className="w-full bg-brand-primary py-2 px-6 text-center flex items-center justify-center shadow-inner">
          <p className="text-white text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] break-words leading-relaxed max-w-5xl">
            ✨ {branding.top_banner} ✨
          </p>
        </div>
      )}

      <div ref={productsTopRef} className="max-w-7xl mx-auto px-4 py-8 md:py-16 w-full text-center flex flex-col items-center gap-4">
        <div className="mb-4 md:mb-10 pt-2 w-full flex flex-col items-center gap-3 pb-4">
          <h2 className="text-[10px] md:text-lg font-light tracking-[0.4em] uppercase text-brand-primary animate-in slide-in-from-bottom-2 duration-700 block break-words leading-relaxed px-6">
            {(activeCategory === 'Todos' || !activeCategory) 
              ? `${branding?.store_name || branding?.business_name || 'Coleção'} Exclusiva` 
              : activeCategory}
          </h2>
          <div className="w-8 h-[1px] bg-brand-secondary/10 mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2.5 md:gap-x-8 gap-y-6 md:gap-y-16 px-0.5 animate-in fade-in slide-in-from-bottom-4 duration-1000 w-full">
          {displayedProducts.map((product, index) => {
            const hasValidImage = product.image_url && 
                                 product.image_url.length > 5 &&
                                 product.image_url !== 'undefined' && 
                                 product.image_url !== 'null' &&
                                 !imageErrors[product.id];
            
            return (
              <div key={product.id} className="group flex flex-col items-center w-full">
                <Link href={`/product?id=${product.id}&catalogo=true${storeParam}`} className="w-full focus:outline-none">
                  <div className="aspect-[4/5] w-full bg-brand-secondary/5 rounded-[24px] md:rounded-[36px] overflow-hidden mb-3 shadow-sm relative transition-all duration-500 group-hover:shadow-md group-hover:-translate-y-1 border border-brand-secondary/5">
                    {hasValidImage ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                        loading={index < 8 ? "eager" : "lazy"}
                        onError={() => handleImageError(product.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-10">
                        <Gem size={20} />
                        <span className="text-[6px] font-black uppercase tracking-widest">Sem Foto</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-0.5 text-center w-full mb-3 min-h-fit h-auto">
                    <h4 className="text-[8px] md:text-[10px] font-black tracking-[0.05em] uppercase text-brand-primary mb-1 leading-relaxed transition-colors group-hover:text-brand-secondary px-1 whitespace-normal break-words h-auto">
                      {product.name}
                    </h4>
                    <div className="flex flex-col gap-0 h-auto">
                      <span className="text-[11px] md:text-[14px] font-bold text-brand-primary">
                        R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <p className="text-brand-secondary text-[6px] md:text-[7px] font-black tracking-widest uppercase opacity-30">
                        {installments}x de R$ {(Number(product.price) / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="w-full px-0.5 md:px-2">
                  <AddToCartButton product={product} />
                </div>
              </div>
            )
          })}
        </div>
        
        {!loading && displayedProducts.length === 0 && (
          <div className="py-20">
            <Gem size={24} className="text-brand-secondary/10 mb-3 mx-auto" />
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-secondary/20">Coleção em breve 💎</p>
          </div>
        )}
      </div>
    </div>
  )
}

