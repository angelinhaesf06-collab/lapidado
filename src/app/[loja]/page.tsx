import { redirect } from 'next/navigation'

// 🔗 Compatibilidade do LINK LIMPO (/nome-da-loja): redireciona para o formato
// que a vitrine já entende (?catalogo=true&loja=...). É um redirect simples e
// instantâneo — não faz SSR pesado aqui, então não trava como o rewrite anterior.
// Rotas reais (/login, /admin, /product, etc.) têm prioridade sobre esta rota
// dinâmica, então continuam funcionando normalmente.
export default async function LojaRedirect({ params }: { params: Promise<{ loja: string }> }) {
  const { loja } = await params
  redirect(`/?catalogo=true&loja=${encodeURIComponent(loja)}`)
}
