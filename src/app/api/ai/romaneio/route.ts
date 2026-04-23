import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 45;

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

    const genAI = new GoogleGenerativeAI(geminiKey);
    // 🚀 MOTOR LAPIDADO: FORÇANDO v1 (ESTÁVEL)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "Você é um robô extrator de dados. Retorne APENAS um array JSON: [{\"name\": \"...\", \"quantity\": 0, \"unitCost\": 0.0}]",
    }, { apiVersion: 'v1' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.1 }
    });

    const response = await result.response;
    const aiText = response.text().trim();

    const start = aiText.indexOf('[');
    const end = aiText.lastIndexOf(']');
    
    if (start !== -1 && end !== -1) {
       return NextResponse.json(JSON.parse(aiText.substring(start, end + 1)));
    }
    
    throw new Error("A IA não conseguiu gerar a lista estruturada.");

  } catch (error: any) {
    return NextResponse.json({ error: "ERRO_IA_ROMANEIO", details: error.message }, { status: 500 });
  }
}
