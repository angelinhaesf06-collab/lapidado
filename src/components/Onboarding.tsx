'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

// 💎 Tela de boas-vindas (UMA tela só) mostrada apenas na PRIMEIRA vez que a lojista
// entra (web ou app). Não aparece para clientes (vitrine pública) nem repete depois.
const STORAGE_KEY = 'lapidado_onboarding_v1'

const SERIF = 'Georgia, "Times New Roman", serif'

const BENEFITS = [
  'Cadastre suas joias e a inteligência escreve a descrição que vende.',
  'Calcule preço e lucro na hora, sem complicação.',
  'Compartilhe sua vitrine no WhatsApp e no Instagram.',
]

export default function Onboarding() {
  const [show, setShow] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 🚫 Visão do cliente (vitrine pública): nunca mostra o onboarding da lojista
    const isCustomer =
      !!searchParams.get('loja') ||
      searchParams.get('catalogo') === 'true' ||
      pathname?.startsWith('/product') === true ||
      pathname?.startsWith('/cart') === true

    // ✅ Pontos de entrada da lojista (primeira tela ao abrir)
    const isEntry = pathname === '/login' || pathname === '/'

    let alreadySeen = false
    try {
      alreadySeen = localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      alreadySeen = false
    }

    if (!isCustomer && isEntry && !alreadySeen) {
      setShow(true)
    }
  }, [pathname, searchParams])

  const markSeen = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* armazenamento indisponível: segue sem travar */
    }
    setShow(false)
  }

  const handleStart = () => {
    markSeen()
    router.push('/register')
  }

  const handleLogin = () => {
    markSeen()
    router.push('/login')
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Boas-vindas ao Lapidado"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        background: '#efdacf',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 'env(safe-area-inset-top, 16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        overflow: 'hidden',
      }}
    >
      {/* Círculos decorativos suaves */}
      <div aria-hidden style={{ position: 'absolute', top: -60, left: -40, width: 200, height: 200, background: '#f6e7df', borderRadius: '50%' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: -70, right: -50, width: 220, height: 220, background: '#f6e7df', borderRadius: '50%' }} />

      {/* Botão Entrar (para quem já tem conta) */}
      <div style={{ position: 'absolute', top: 'env(safe-area-inset-top, 16px)', right: 0, zIndex: 1, padding: '12px 20px' }}>
        <button
          onClick={handleLogin}
          style={{ background: 'transparent', border: 'none', color: '#a9725f', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', padding: 8 }}
        >
          Entrar
        </button>
      </div>

      {/* Conteúdo central */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 380,
          padding: '0 32px',
          animation: 'lapFade 0.4s ease',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-app.png"
          alt="Lapidado Catálogo"
          style={{ width: 132, height: 132, borderRadius: 30, boxShadow: '0 20px 50px rgba(169,114,95,0.28)', marginBottom: 24 }}
        />

        <h2 style={{ fontFamily: SERIF, fontSize: 25, color: '#5a3e36', margin: '0 0 8px', fontWeight: 500, lineHeight: 1.2 }}>
          Seu catálogo de semijoias
        </h2>
        <p style={{ fontSize: 13, color: '#a9725f', margin: '0 0 26px', fontWeight: 600, letterSpacing: 1 }}>
          PROFISSIONAL E COM INTELIGÊNCIA ARTIFICIAL
        </p>

        {/* Resumo do que o app faz */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', marginBottom: 32 }}>
          {BENEFITS.map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}>
              <span
                aria-hidden
                style={{ flexShrink: 0, width: 10, height: 10, marginTop: 5, background: '#c98e7d', transform: 'rotate(45deg)', borderRadius: 2 }}
              />
              <span style={{ fontSize: 14, color: '#7a5c54', lineHeight: 1.5, fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Botão principal */}
        <button
          onClick={handleStart}
          style={{
            width: '100%',
            background: '#a9725f',
            color: '#fff7f2',
            border: 'none',
            borderRadius: 20,
            padding: '17px 0',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 14px 32px rgba(169,114,95,0.3)',
          }}
        >
          Começar agora
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>

        <button
          onClick={handleLogin}
          style={{ marginTop: 16, background: 'transparent', border: 'none', color: '#a9725f', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Já tenho conta · Entrar
        </button>
      </div>

      <style>{`@keyframes lapFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  )
}
