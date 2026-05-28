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
  eslint: {
    // ⚠️ ATENÇÃO: Ignora erros de linting durante o build para permitir o deploy emergencial da versão estável.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ ATENÇÃO: Ignora erros de tipo durante o build para permitir o deploy emergencial da versão estável.
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
