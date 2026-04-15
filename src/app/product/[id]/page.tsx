import Link from 'next/link'
import { notFound } from 'next/navigation'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient()

  // 1. Buscar o produto real do banco de dados
  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', id)
    .single()

  // 2. Buscar branding para parcelamento e garantia personalizada
  const { data: branding } = await supabase.from('branding').select('*').single()
  const warrantyText = branding?.instagram || '6 MESES'
  
  // Extrair parcelamento do campo facebook (formato: Tagline|Parcelas|Banner)
  const installments = parseInt(branding?.facebook?.split('|')[1] || '10')

  if (!product) {
    notFound();
  }

  // 3. Lógica para limpar descrição e extrair banho (resiliente)
  let displayDescription = product.description || ''
  let materialFinish = (product as any).material_finish || ''

  if (displayDescription.includes('---')) {
    const parts = displayDescription.split('---')
    displayDescription = parts[0].trim()
    
    // Tentar extrair do JSON se a coluna material_finish estiver vazia
    if (!materialFinish) {
      const match = product.description.match(/DATA:({.*})/)
      if (match) {
        try {
          const extraData = JSON.parse(match[1])
          materialFinish = extraData.finish
        } catch {}
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center">
      <div className="w-full mb-20 text-center">
        <Link href="/" className="text-[10px] font-light tracking-[0.4em] uppercase text-brand-secondary hover:text-brand-primary transition-colors">
          ← Voltar ao Catálogo
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center w-full">
        <div className="relative aspect-[4/5] bg-white rounded-[80px] overflow-hidden shadow-2xl border border-brand-secondary/10 mx-auto w-full max-w-lg">
          <Image src={product.image_url} alt={product.name} className="object-cover" fill />
        </div>

        <div className="flex flex-col items-center text-center max-w-xl mx-auto lg:mx-0">
          <span className="text-brand-secondary font-light tracking-[0.5em] uppercase text-[10px] mb-6 block">{product.categories?.name || 'Joia'}</span>
          <h2 className="text-4xl font-normal tracking-[0.1em] uppercase text-brand-primary mb-10 leading-tight">{product.name}</h2>
          
          <div className="flex flex-col items-center gap-4 mb-16">
            <span className="text-5xl font-light text-brand-primary">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-brand-secondary text-sm font-light tracking-widest uppercase">
              {installments}x de R$ {(product.price / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
            </p>
          </div>

          <div className="space-y-8 mb-20 w-full flex flex-col items-center border-t border-brand-secondary/10 pt-16 text-center">
            {materialFinish && (
              <div className="px-6 py-2 bg-brand-secondary/5 border border-brand-secondary/10 rounded-full mb-8">
                <span className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">
                  Acabamento: {materialFinish}
                </span>
              </div>
            )}
            <h3 className="text-[9px] font-semibold text-brand-primary uppercase tracking-[0.5em] mb-4">
              Descrição da Peça
            </h3>
            <p className="text-xl text-brand-primary/80 font-light leading-relaxed max-w-md">
              {displayDescription}
            </p>
          </div>

          <div className="w-fit">
            <AddToCartButton product={product} />
          </div>
          
          <p className="mt-20 text-[9px] text-brand-primary/60 font-light opacity-50 tracking-[0.3em] uppercase text-center">
            💎 Garantia {warrantyText} de banho • Lapidado
          </p>
        </div>
      </div>
    </div>
  )
}
