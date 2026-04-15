'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Pencil, Image as ImageIcon, Loader2, ArrowLeft, Gem, Share2, Camera } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  categories: { name: string } | null;
}

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  const loadProducts = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 💎 NEXUS: Consulta resiliente para restaurar acervo antigo
    // Busca produtos do usuário logado OU produtos que ainda não têm user_id
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false })
    if (data) setProducts(data as unknown as Product[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleDelete = async (id: string, imageUrl: string | null) => {
    if (!confirm('TEM CERTEZA QUE DESEJA REMOVER ESTA JOIA DA VITRINE? 💎')) return
    
    setDeletingId(id)
    try {
      // 💎 MÁGICA NEXUS: EXCLUSÃO VIA SERVIDOR (Bypass de RLS)
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer LAPIDADO_ADMIN_2026'
        },
        body: JSON.stringify({ table: 'products', id, imageUrl })
      })
      
      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      setProducts(products.filter(p => p.id !== id))
      alert('JOIA REMOVIDA COM SUCESSO! ✨')
    } catch (err: unknown) {
      alert('ERRO AO EXCLUIR: ' + (err as Error).message.toUpperCase())
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 pb-20">
      <div className="flex items-center justify-between mb-12">
        <div>
          <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-4 hover:ml-2 transition-all">
            <ArrowLeft size={14} /> Voltar ao Painel
          </Link>
          <h1 className="text-3xl font-bold text-brand-primary uppercase tracking-tight flex items-center gap-3">
            <Gem className="text-brand-secondary" /> Gestão da Vitrine
          </h1>
        </div>
        <Link href="/admin/products/new" className="px-8 py-4 bg-brand-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary transition-all shadow-lg">
          Nova Peça
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-brand-secondary" size={40} />
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Carregando Acervo...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-[40px] border border-brand-secondary/10 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative">
              {/* Imagem do Produto */}
              <div className="aspect-square relative overflow-hidden bg-brand-secondary/5">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} className="object-cover group-hover:scale-110 transition-transform duration-500" fill />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-secondary/30">
                    <ImageIcon size={48} />
                  </div>
                )}
                
                {/* Overlay de Ações */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                   <button 
                    onClick={() => handleDelete(product.id, product.image_url)}
                    disabled={deletingId === product.id}
                    className="p-4 bg-white rounded-full text-red-500 hover:scale-110 transition-all shadow-lg"
                    title="Excluir"
                   >
                     {deletingId === product.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                   </button>
                   
                   <Link 
                    href={`/admin/products/edit/${product.id}`} 
                    className="p-4 bg-white rounded-full text-brand-primary hover:scale-110 transition-all shadow-lg"
                    title="Editar"
                   >
                     <Pencil size={20} />
                   </Link>

                   <button 
                    onClick={() => {
                      const msg = encodeURIComponent(`OLÁ! ✨ OLHA QUE LINDA ESSA JOIA: *${product.name}*\n\n💎 VALOR: R$ ${Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nCONFIRA MAIS DETALHES AQUI: ${window.location.origin}/product/${product.id}`)
                      window.open(`https://wa.me/?text=${msg}`, '_blank')
                    }}
                    className="p-4 bg-[#25D366] rounded-full text-white hover:scale-110 transition-all shadow-lg"
                    title="WhatsApp"
                   >
                     <Share2 size={20} />
                   </button>

                   <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: product.name,
                          text: `💎 ${product.name} - R$ ${Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nConfira no catálogo Lapidado!`,
                          url: `${window.location.origin}/product/${product.id}`,
                        }).catch(() => {});
                      } else {
                        window.open('https://www.instagram.com/', '_blank');
                      }
                    }}
                    className="p-4 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-full text-white hover:scale-110 transition-all shadow-lg"
                    title="Instagram Stories"
                   >
                     <Camera size={20} />
                   </button>
                </div>
              </div>

              {/* Info do Produto */}
              <div className="p-6">
                <p className="text-[8px] font-black text-brand-secondary uppercase tracking-widest mb-1">{product.categories?.name || 'SEM CATEGORIA'}</p>
                <h3 className="text-lg font-bold text-brand-primary uppercase mb-2 line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-black text-brand-primary">R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span className="text-[10px] font-bold text-brand-secondary bg-brand-secondary/10 px-3 py-1 rounded-full">{product.stock_quantity} PÇS</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-20 bg-brand-secondary/5 rounded-[60px] border border-dashed border-brand-secondary/10">
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">A vitrine está vazia. Comece a brilhar!</p>
        </div>
      )}
    </div>
  )
}
