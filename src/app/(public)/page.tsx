import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { redirect } from 'next/navigation'

export const revalidate = 3600 // Cache de 1 hora para velocidade máxima

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; catalogo?: string }>;
}) {
  const params = await searchParams;
  const isPublicCatalog = params.catalogo === 'true';

  // 💎 REGRA DE NEGÓCIO: Se abrir lapidado.com.br seco, vai pro login
  if (!isPublicCatalog) {
    redirect('/login');
  }

  const activeCategory = params.category || 'Todos';
  const supabase = await createClient()

  // Carregar configurações de parcelamento
  const { data: branding } = await supabase.from('branding').select('facebook').single()
  const installments = parseInt(branding?.facebook?.split('|')[1] || '10')

  const { data: dbCategories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')
  
  const categoryNames = ['Todos', ...(dbCategories?.map(c => c.name) || [])]
  
  let query = supabase
    .from('products')
    .select('*, categories!inner(name)')
    .order('created_at', { ascending: false })

  if (activeCategory !== 'Todos') {
    query = query.eq('categories.name', activeCategory)
  }

  const { data: products, error: prodError } = await query

  // 💎 VERIFICAR SE É ADMIN LOGADO PARA MOSTRAR BOTÃO DE RETORNO
  const { data: { session } } = await supabase.auth.getSession();
  const isAdmin = !!session;

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* 💎 BARRA DE FERRAMENTAS DA EMPRESÁRIA (Só aparece para você) */}
      {isAdmin && (
        <div className="bg-brand-primary py-2 px-4 flex justify-between items-center sticky top-0 z-[100] shadow-lg border-b border-white/10">
          <p className="text-[8px] font-black text-white/80 uppercase tracking-[0.3em]">Modo Visualização (Empresária)</p>
          <Link href="/admin" className="bg-white text-brand-primary px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-brand-secondary hover:text-white transition-all">
            Voltar ao Painel
          </Link>
        </div>
      )}

      {/* 💎 DEBUG MÁGICO: Só aparece se houver erro real no banco */}
      {(catError || prodError || !products || products.length === 0) && (
        <div className="bg-black text-white text-[8px] p-2 text-center">
          DADOS: {products?.length || 0} | CATS: {dbCategories?.length || 0} | 
          ERRO_P: {prodError?.message || 'OK'} | ERRO_C: {catError?.message || 'OK'} |
          URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'DEFINIDA' : 'AUSENTE'}
        </div>
      )}
      {/* Navegação Mobile e Desktop Superior - Sem deslizar, tudo visível */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-brand-secondary/10 sticky top-[158px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 py-2 md:py-4 flex flex-wrap justify-center gap-2 md:gap-8">
          {categoryNames.map((cat) => (
            <Link 
              key={cat}
              href={`/?category=${cat === 'Todos' ? '' : cat}`}
              className={`px-3 py-1 transition-all font-bold text-[9px] md:text-[11px] tracking-[0.1em] md:tracking-[0.3em] uppercase rounded-full border ${
                activeCategory === cat
                ? "bg-brand-primary text-white border-brand-primary shadow-sm" 
                : "text-brand-primary/70 hover:text-brand-primary bg-brand-secondary/5 border-brand-secondary/10"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-20 w-full text-center">
        <div className="mb-6 md:mb-20">
          <h2 className="text-lg md:text-3xl font-light tracking-[0.2em] uppercase text-brand-primary mb-1 md:mb-3">
            {activeCategory === 'Todos' ? 'Coleção Completa' : activeCategory}
          </h2>
          <p className="text-brand-secondary text-[8px] md:text-[10px] font-bold md:font-light tracking-[0.2em] uppercase">{(products?.length || 0)} Peças</p>
        </div>

        {/* Grid de 2 Colunas no Mobile, 3 em tablets e 4 em desktops */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-12 gap-y-8 md:gap-y-24 px-1 md:px-0">
          {products && products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="group flex flex-col items-center">
                <Link href={`/product/${product.id}?catalogo=true`} className="w-full">
                  <div className="aspect-[4/5] w-full bg-white rounded-[16px] md:rounded-[40px] overflow-hidden mb-3 md:mb-10 shadow-sm border border-brand-secondary/10 relative transition-all duration-700">
                    <Image 
                      src={product.image_url} 
                      alt={product.name} 
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                    />
                  </div>
                  
                  <div className="px-1 text-center w-full mb-4">
                    <h4 className="text-[9px] md:text-sm font-bold md:font-normal tracking-[0.05em] md:tracking-[0.2em] uppercase text-brand-primary mb-1 md:mb-3 truncate w-full">{product.name}</h4>
                    <div className="flex flex-col gap-0.5 md:gap-2">
                      <span className="text-[12px] md:text-lg font-bold md:font-light text-brand-primary">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <p className="text-brand-secondary text-[7px] md:text-[9px] font-bold md:font-light tracking-tighter md:tracking-widest uppercase opacity-80">
                        {installments}x de R$ {(product.price / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
                      </p>
                    </div>
                  </div>
                </Link>
                
                {/* 💎 BOTÃO DE COMPRA DIRETA (MÁGICA NEXUS) */}
                <div className="w-full max-w-[140px] md:max-w-none px-2 md:px-6">
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
