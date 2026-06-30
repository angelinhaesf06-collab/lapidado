import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true, // ⚡ ATIVA COMPRESSÃO GZIP/BROTLI
  images: {
    deviceSizes: [640, 750, 828], // ⚡ LIMITA TAMANHOS PARA MOBILE
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lkftxcnfzpjrhwjobfsr.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  experimental: {
    // 🚀 Otimização de performance
  },
  // 🔗 LINK LIMPO POR LOJA: /nome-da-loja abre a vitrine certa (sem ?catalogo=true&loja=).
  // 'fallback' só age quando nenhuma rota/arquivo real combinou, então /login, /admin,
  // /product etc. continuam funcionando normalmente. Os links antigos (?loja=) seguem válidos.
  async rewrites() {
    return {
      fallback: [
        { source: '/:loja', destination: '/?catalogo=true&loja=:loja' },
      ],
    };
  },
};

export default nextConfig;
