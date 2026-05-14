import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.GEMINI_API_KEY || "NÃO ENCONTRADA";
  const stripeKey = process.env.STRIPE_SECRET_KEY || "NÃO ENCONTRADA";
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET || "NÃO ENCONTRADA";
  
  return NextResponse.json({
    gemini: {
      presente: key !== "NÃO ENCONTRADA",
      prefixo: key.substring(0, 8)
    },
    stripe: {
      secret_key_presente: stripeKey !== "NÃO ENCONTRADA" && stripeKey !== "sk_test_placeholder",
      webhook_secret_presente: stripeWebhook !== "NÃO ENCONTRADA",
      monthly_price_id: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || "NÃO DEFINIDO",
      yearly_price_id: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || "NÃO DEFINIDO"
    },
    revenuecat: {
      google_key_presente: process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY !== undefined && process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY !== "goog_placeholder",
      prefixo: (process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY || "").substring(0, 8)
    },
    env_keys: Object.keys(process.env).filter(k => k.includes("STRIPE") || k.includes("REVENUECAT") || k.includes("GEMINI"))
  });
}
