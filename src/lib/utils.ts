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
