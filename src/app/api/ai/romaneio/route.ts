import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 45;

/**
 * 💎 MOTOR LAPIDADO: ROMANEIO v2 ESTÁVEL (SDK)
 */
export async function POST(req: Request) {
  try {
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (!geminiKey) {
      return NextResponse.json({ error: "ERRO_CONFIG", details: "Chave API ausente." }, { status: 401 });
    }

    const payload = await req.json();
    const { image } = payload;
    if (!image) return NextResponse.json({ error: "ERRO_IA_ROMANEIO", details: "Arquivo não fornecido." }, { status: 400 });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    // 🚀 MODELO 2.5 FLASH (JSON PURO)
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { 
        maxOutputTokens: 250, 
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    const prompt = `
      Analise a lista de compras na imagem.
      Retorne um array JSON: [{"name": "ITEM", "quantity": 1, "unitCost": 0.00}]
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64Data } }
    ]);

    const response = await result.response;
    const aiText = response.text().trim();

    const start = aiText.indexOf('[');
    const end = aiText.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error("A IA não conseguiu gerar a lista estruturada.");
    
    const jsonStr = aiText.substring(start, end + 1);
    return NextResponse.json(JSON.parse(jsonStr));

  } catch (error: any) {
    console.error("ERRO ROMANEIO:", error.message);
    return NextResponse.json({ 
      error: "ERRO_IA_ROMANEIO", 
      details: error.message 
    }, { status: 500 });
  }
}
