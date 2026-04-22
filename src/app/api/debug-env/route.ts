import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.GEMINI_API_KEY || "NÃO ENCONTRADA";
  const publicKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "NÃO ENCONTRADA";
  
  return NextResponse.json({
    gemini_api_key: {
      presente: key !== "NÃO ENCONTRADA",
      tamanho: key.length,
      prefixo: key.substring(0, 8),
      sufixo: key.substring(key.length - 4)
    },
    next_public_gemini_api_key: {
      presente: publicKey !== "NÃO ENCONTRADA",
      tamanho: publicKey.length,
      prefixo: publicKey.substring(0, 8)
    },
    env_keys: Object.keys(process.env).filter(k => k.includes("GEMINI") || k.includes("SUPABASE"))
  });
}
