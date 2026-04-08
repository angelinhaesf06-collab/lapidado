import { ChevronLeft, Star } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AddToCartButton from '@/components/cart/add-to-cart-button'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const previewProducts = [
    { id: '1', name: "BRINCO GOTA CRISTAL ROSE", price: 89.90, category: "Brincos", image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop", description: "Brinco elegante em formato de gota, lapidado com cristais translúcidos. Banhado a ouro rose 18k, ideal para sofisticação e brilho discreto." },
    { id: '2', name: "BRINCO ARGOLA DELICADA", price: 69.90, category: "Brincos", image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop", description: "Argola clássica com acabamento polido premium. Leve e confortável para o dia a dia." },
    { id: '3', name: "CORRENTE CORAÇÃO CRISTAL", price: 149.90, category: "Correntes", image_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2070&auto=format&fit=crop", description: "Corrente veneziana com pingente de coração lapidado. Acabamento em ouro 18k." },
    { id: '4', name: "PULSEIRA ELO PORTUGUÊS", price: 159.00, category: "Pulseiras", image_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2070&auto=format&fit=crop", description: "Pulseira delicada elo português banhada a ouro 18k." },
    { id: '5', name: "ANEL SOLITÁRIO BRILHANTE", price: 199.00, category: "Anéis", image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop", description: "Um solitário imponente para momentos inesquecíveis." },
    { id: '6', name: "CONJUNTO GALA ROSE", price: 345.00, category: "Conjuntos", image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1974&auto=format&fit=crop", description: "Conjunto completo com colar e brincos em cristal rose." },
    { id: '7', name: "TORNOZELEIRA VERÃO", price: 75.00, category: "Tornozeleiras", image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop", description: "Tornozeleira sutil com pingentes delicados." }
  ]

  const product = previewProducts.find(p => p.id === id);

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
          <span className="text-[#c99090] font-light tracking-[0.5em] uppercase text-[10px] mb-6 block">{product.category}</span>
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
