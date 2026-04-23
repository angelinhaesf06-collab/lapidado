import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * 💎 MOTOR LAPIDADO: ESTABILIZAÇÃO TOTAL (SYSTEM INSTRUCTIONS)
 */
export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (!apiKey) {
      return NextResponse.json({ error: "ERRO_CONFIG", details: "Chave API ausente." }, { status: 401 });
    }

    const payload = await req.json();
    const { image } = payload;
    if (!image) return NextResponse.json({ error: "DADOS_AUSENTES" }, { status: 400 });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    
    // 🚀 MOTOR LAPIDADO: CONFIGURAÇÃO DE ALTA PRECISÃO
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "Você é um robô que gera APENAS JSON. Nunca use conversas, saudações ou blocos de código. Responda estritamente com o objeto: {\"name\": \"...\", \"category\": \"...\", \"description\": \"...\"}. A descrição deve ter no máximo 3 frases luxuosas.",
    });
    
    let result;
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
          generationConfig: { 
            maxOutputTokens: 200, 
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });
        break; 
      } catch (err: any) {
        retries--;
        if (retries === 0) throw err;
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      }
    }

    const response = await result!.response;
    const aiText = response.text().trim();

    // 💎 NEXUS: PARSER ROBUSTO
    const start = aiText.indexOf('{');
    const end = aiText.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error(`Resposta inválida da IA (Sem JSON).`);
    }

    const cleanedJson = aiText.substring(start, end + 1);
    return NextResponse.json(JSON.parse(cleanedJson));

  } catch (error: any) {
    console.error("ERRO CRÍTICO IA:", error.message);
    return NextResponse.json({ 
      error: "FALHA_MOTOR_IA", 
      details: error.message 
    }, { status: 500 });
  }
}
