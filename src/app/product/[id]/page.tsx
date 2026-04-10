import { ChevronLeft, Star } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { createClient } from '@/lib/supabase/server'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient()

  // Buscar o produto real do banco de dados
  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', id)
    .single()

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center">
      <div className="w-full mb-20 text-center">
        <Link href="/" className="text-[10px] font-light tracking-[0.4em] uppercase text-[#c99090] hover:text-[#4a322e] transition-colors">
          ← Voltar ao Catálogo
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center w-full">
        <div className="aspect-[4/5] bg-white rounded-[80px] overflow-hidden shadow-2xl border border-rose-50 mx-auto w-full max-w-lg">
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col items-center text-center max-w-xl mx-auto lg:mx-0">
          <span className="text-[#c99090] font-light tracking-[0.5em] uppercase text-[10px] mb-6 block">{product.categories?.name || 'Joia'}</span>
          <h2 className="text-4xl font-normal tracking-[0.1em] uppercase text-[#4a322e] mb-10 leading-tight">{product.name}</h2>
          
          <div className="flex flex-col items-center gap-4 mb-16">
            <span className="text-5xl font-light text-[#4a322e]">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[#c99090] text-sm font-light tracking-widest uppercase">
              10x de R$ {(product.price / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
            </p>
          </div>

          <div className="space-y-8 mb-20 w-full flex flex-col items-center border-t border-rose-50 pt-16 text-center">
            <h3 className="text-[9px] font-semibold text-[#4a322e] uppercase tracking-[0.5em] mb-4">
              Descrição da Peça
            </h3>
            <p className="text-xl text-[#7a5c58] font-light leading-relaxed max-w-md">
              {product.description}
            </p>
          </div>

          <div className="w-fit">
            <AddToCartButton product={product} />
          </div>
          
          <p className="mt-20 text-[9px] text-[#7a5c58] font-light opacity-50 tracking-[0.3em] uppercase">
            💎 Garantia eterna de banho • Lapidado
          </p>
        </div>
      </div>
    </div>
  )
}
