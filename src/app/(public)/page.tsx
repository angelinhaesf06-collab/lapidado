import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { redirect } from 'next/navigation'

export const revalidate = 3600 // Cache de 1 hora para velocidade máxima

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; catalogo?: string; loja?: string }>;
}) {
  const params = await searchParams;
  const isPublicCatalog = params.catalogo === 'true';
  const storeSlug = params.loja;

  // 💎 REGRA DE NEGÓCIO: Se abrir lapidado.com.br seco, vai pro login
  if (!isPublicCatalog) {
    redirect('/login');
  }

  const activeCategory = params.category || 'Todos';
  const supabase = await createClient()

  // 💎 NEXUS: Identificação de Loja por Slug ou Fallback
  let branding = null
  
  if (storeSlug) {
    // 1. Busca específica por slug (Loja identificada na URL)
    const { data: storeBranding } = await supabase.from('branding').select('*').eq('slug', storeSlug).single()
    branding = storeBranding
  }

  if (!branding) {
    // 2. Se não houver slug, busca o usuário logado (Admin em preview)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userBranding } = await supabase.from('branding').select('*').eq('user_id', user.id).limit(1)
      branding = userBranding?.[0]
    }
  }
  
  if (!branding) {
    // 3. Fallback: Qualquer loja (Para evitar tela branca)
    const { data: anyBranding } = await supabase.from('branding').select('*').limit(1)
    branding = anyBranding?.[0]
  }

  const currentUserId = branding?.user_id
  const installments = parseInt(branding?.facebook?.split('|')[1] || '10')

  // 💎 NEXUS: Filtro Mandatário pelo Dono da Loja
  // Se o currentUserId for null (caso de teste/admin manual), mostra tudo.
  // Se houver ID, isola COMPLETAMENTE o catálogo.
  let catQuery = supabase.from('categories').select('id, name')
  if (currentUserId) {
    catQuery = catQuery.eq('user_id', currentUserId)
  }
  
  const { data: dbCategories, error: catError } = await catQuery.order('name')
  const categoryNames = ['Todos', ...(dbCategories?.map(c => c.name) || [])]
  
  let prodQuery = supabase.from('products').select('*, categories!inner(name)')
  if (currentUserId) {
    prodQuery = prodQuery.eq('user_id', currentUserId)
  }

  let finalQuery = prodQuery.order('created_at', { ascending: false })

  if (activeCategory !== 'Todos') {
    finalQuery = finalQuery.eq('categories.name', activeCategory)
  }

  const { data: products, error: prodError } = await finalQuery

  // Injetar o slug nos links para manter o tenant durante a navegação
  const storeParam = storeSlug ? `&loja=${storeSlug}` : ''

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* 💎 DEBUG MÁGICO: Só aparece se houver erro real no banco */}
      {(catError || prodError) && (
        <div className="bg-black text-white text-[8px] p-2 text-center">
          ERRO_P: {prodError?.message || 'OK'} | ERRO_C: {catError?.message || 'OK'} 
        </div>
      )}
      {/* Navegação Mobile e Desktop Superior - Agora mais próxima do topo */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-brand-secondary/10 sticky top-[56px] md:top-[72px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 py-2 md:py-3 flex flex-wrap justify-center gap-2 md:gap-6 min-h-[40px] items-center">
          {dbCategories && dbCategories.length > 0 ? (
            categoryNames.map((cat) => (
              <Link 
                key={cat}
                href={`/?catalogo=true&category=${cat === 'Todos' ? '' : cat}${storeParam}`}
                className={`px-3 py-1.5 transition-all font-bold text-[9px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] uppercase rounded-full border ${
                  activeCategory === cat
                  ? "bg-brand-primary text-white border-brand-primary shadow-md" 
                  : "text-brand-primary/70 hover:text-brand-primary bg-brand-secondary/5 border-brand-secondary/10"
                }`}
              >
                {cat}
              </Link>
            ))
          ) : (
            <div className="flex items-center gap-3 px-4 py-1 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary/40 animate-pulse" />
              <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-brand-primary/40">
                Explorando Coleções Exclusivas
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary/40 animate-pulse" />
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 w-full text-center">
        <div className="mb-8 md:mb-16">
          <h2 className="text-xl md:text-2xl font-light tracking-[0.2em] uppercase text-brand-primary mb-2">
            {activeCategory === 'Todos' ? 'Coleção Completa' : activeCategory}
          </h2>
          <div className="w-12 h-[1px] bg-brand-secondary/30 mx-auto mb-2" />
          <p className="text-brand-secondary text-[8px] md:text-[9px] font-bold tracking-[0.2em] uppercase opacity-60">{(products?.length || 0)} Itens Selecionados</p>
        </div>

        {/* Grid de Vitrine Otimizada */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-10 gap-y-10 md:gap-y-20 px-1">
          {products && products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="group flex flex-col items-center">
                <Link href={`/product/${product.id}?catalogo=true`} className="w-full">
                  <div className="aspect-[4/5] w-full bg-white rounded-[40px] md:rounded-[64px] overflow-hidden mb-6 md:mb-10 shadow-[0_20px_60px_rgba(74,50,46,0.08)] border border-white relative transition-all duration-700 group-hover:shadow-[0_40px_80px_rgba(74,50,46,0.12)]">
                    <Image 
                      src={product.image_url} 
                      alt={product.name} 
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000 z-10" 
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
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
                
                {/* 💎 BOTÃO DE COMPRA DIRETA (MÁGICA NEXUS) */}
                <div className="w-full max-w-[140px] md:max-w-none px-2 md:px-6 flex flex-col items-center gap-4">
                  <Link href={`/product/${product.id}?catalogo=true${storeParam}`} className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-brand-secondary hover:text-brand-primary transition-all border-b border-transparent hover:border-brand-secondary/40 pb-1">
                    Espiar Peça
                  </Link>
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
