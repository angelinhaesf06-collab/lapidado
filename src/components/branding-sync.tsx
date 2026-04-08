'use client'

import { useEffect } from 'react'

export default function BrandingSync() {
  useEffect(() => {
    // Carrega as cores salvas do localStorage
    const savedBranding = localStorage.getItem('lapidado-branding')
    if (savedBranding) {
      const { primary, secondary } = JSON.parse(savedBranding)
      document.documentElement.style.setProperty('--brand-primary', primary)
      document.documentElement.style.setProperty('--brand-secondary', secondary)
    }
  }, [])

  return null // Este componente não renderiza nada, apenas sincroniza as cores
}
