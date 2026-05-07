import type { NextConfig } from "next";
import path from "path";

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
  }
};

export default nextConfig;
