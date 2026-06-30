/**
 * Gera um slug amigável e limpo para URLs
 * Padrão Nexus: letras minúsculas, sem acentos, sem caracteres especiais.
 */
export function generateSlug(text: string): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '-')     // Substitui caracteres especiais por hifen
    .replace(/-+/g, '-')            // Remove hifens duplicados
    .replace(/^-|-$/g, '')          // Remove hifens no início ou fim
}

/**
 * Rotas reais do app (segmento único) que NUNCA são nome de loja.
 * Usado para não confundir /login, /admin etc. com o slug de uma vitrine.
 */
const RESERVED_PATHS = new Set([
  'admin', 'api', 'auth', 'cart', 'excluir-conta', 'login', 'lp',
  'politica', 'policies', 'privacidade', 'product', 'register', 'termos',
  'cookies', 'favicon.ico', 'manifest.json',
])

/**
 * Descobre o slug da loja a partir da URL, aceitando os dois formatos:
 *  - Antigo (compatível): /?catalogo=true&loja=nome-da-loja
 *  - Novo (limpo):        /nome-da-loja
 * Retorna null quando não é uma vitrine (ex: /login, /admin).
 */
export function resolveStoreSlug(
  search: { get(name: string): string | null } | null | undefined,
  pathname: string | null | undefined
): string | null {
  const fromQuery = search?.get('loja')
  if (fromQuery) return fromQuery

  if (pathname) {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 1 && !RESERVED_PATHS.has(segments[0])) {
      return segments[0]
    }
  }
  return null
}

/**
 * Aciona um feedback tátil (vibração) sutil no celular.
 * Usado para dar o "Native Feel" ao realizar ações importantes.
 */
export function triggerHaptic(intensity: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50]
    }
    navigator.vibrate(patterns[intensity])
  }
}
