import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || 'Todos';
  const supabase = await createClient()

  const { data: dbCategories } = await supabase
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

  const { data: products } = await query

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Navegação Mobile e Desktop Superior - Compacta e Visível */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-rose-50 sticky top-[158px] z-40 shadow-sm overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex justify-start md:justify-center gap-4 md:gap-8 min-w-max">
          {categoryNames.map((cat) => (
            <Link 
              key={cat}
              href={`/?category=${cat === 'Todos' ? '' : cat}`}
              className={`px-3 py-1.5 transition-all font-bold text-[9px] md:text-[11px] tracking-[0.15em] md:tracking-[0.3em] uppercase rounded-full ${
                activeCategory === cat
                ? "bg-brand-primary text-white shadow-md" 
                : "text-brand-primary/60 hover:text-brand-primary bg-rose-50/30"
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
              <Link href={`/product/${product.id}`} key={product.id} className="group flex flex-col items-center">
                <div className="aspect-[4/5] w-full bg-white rounded-[16px] md:rounded-[40px] overflow-hidden mb-3 md:mb-10 shadow-sm border border-rose-50 relative transition-all duration-700">
                  <Image 
                    src={product.image_url} 
                    alt={product.name} 
                    fill
                    className="object-cover" 
                  />
                </div>
                
                <div className="px-1 text-center w-full">
                  <h4 className="text-[9px] md:text-sm font-bold md:font-normal tracking-[0.05em] md:tracking-[0.2em] uppercase text-brand-primary mb-1 md:mb-3 truncate w-full">{product.name}</h4>
                  <div className="flex flex-col gap-0.5 md:gap-2">
                    <span className="text-[12px] md:text-lg font-bold md:font-light text-brand-primary">
                      R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-brand-secondary text-[7px] md:text-[9px] font-bold md:font-light tracking-tighter md:tracking-widest uppercase opacity-80">
                      10x de R$ {(product.price / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-[#7a5c58] font-light tracking-widest uppercase">Nenhuma joia encontrada. 💎</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
