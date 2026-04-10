import { createClient } from '@/lib/supabase/server'
import { Star } from 'lucide-react'
import Link from 'next/link'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || 'Todos';
  const supabase = await createClient()

  // Buscar categorias do banco de dados
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')
  
  const categoryNames = ['Todos', ...(dbCategories?.map(c => c.name) || [])]
  
  // Buscar produtos do banco de dados com filtro opcional
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
      {/* Navegação Sem Busca - Foco Total em Categorias */}
      <nav className="bg-white border-b border-rose-50 sticky top-[158px] z-40 shadow-sm overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-center gap-8 min-w-max">
          {categoryNames.map((cat) => (
            <Link 
              key={cat}
              href={`/?category=${cat === 'Todos' ? '' : cat}`}
              className={`px-2 py-1 transition-all font-light text-[11px] tracking-[0.3em] uppercase ${
                activeCategory === cat
                ? "text-[#4a322e] border-b border-[#c99090]" 
                : "text-[#7a5c58] hover:text-[#c99090]"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-20 w-full text-center">
        <div className="mb-20">
          <h2 className="text-3xl font-light tracking-[0.2em] uppercase text-[#4a322e] mb-4">
            {activeCategory === 'Todos' ? 'Coleção Completa' : activeCategory}
          </h2>
          <p className="text-[#c99090] text-[10px] font-light tracking-[0.4em] uppercase">{(products?.length || 0)} Peças Selecionadas</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
          {products && products.length > 0 ? (
            products.map((product) => (
              <Link href={`/product/${product.id}`} key={product.id} className="group flex flex-col items-center">
                <div className="aspect-[4/5] bg-white rounded-[40px] overflow-hidden mb-10 shadow-sm border border-rose-50 relative group-hover:shadow-xl transition-all duration-700">
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                  />
                </div>
                
                <div className="px-4 text-center w-full">
                  <h4 className="text-sm font-normal tracking-[0.2em] uppercase text-[#4a322e] mb-3 group-hover:text-[#c99090] transition-colors">{product.name}</h4>
                  <div className="flex flex-col gap-2">
                    <span className="text-lg font-light text-[#4a322e]">
                      R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-[#c99090] text-[9px] font-light tracking-widest uppercase opacity-80">
                      10x de R$ {(product.price / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-[#7a5c58] font-light tracking-widest uppercase">Nenhuma joia encontrada nesta categoria. 💎</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
