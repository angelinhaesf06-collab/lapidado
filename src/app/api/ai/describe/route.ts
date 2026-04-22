import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * 💎 MOTOR LAPIDADO: ESTABILIZAÇÃO VIA SDK OFICIAL
 * Atualizado para usar gemini-flash-latest via @google/generative-ai
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
    
    // 🚀 INICIALIZAÇÃO DO SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { 
        temperature: 0.1, 
        maxOutputTokens: 300,
        responseMimeType: "application/json"
      }
    });
    
    const prompt = "Analise esta joia e extraia as informações necessárias. Retorne obrigatoriamente um JSON com: {\"name\": \"NOME DA PEÇA EM MAIÚSCULO\", \"category\": \"CATEGORIA\", \"description\": \"DESCRIÇÃO CURTA E LUXUOSA\"}.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64Data } }
    ]);

    const response = await result.response;
    const aiText = response.text().trim();

    try {
      // O Gemini com responseMimeType: "application/json" já retorna JSON puro
      const finalJson = JSON.parse(aiText);
      return NextResponse.json(finalJson);
    } catch (e) {
      // Fallback em caso de algum caractere extra
      const start = aiText.indexOf('{');
      const end = aiText.lastIndexOf('}');
      const cleaned = (start !== -1 && end !== -1) ? aiText.substring(start, end + 1) : aiText;
      return NextResponse.json(JSON.parse(cleaned));
    }

  } catch (error: any) {
    console.error("ERRO CRÍTICO IA:", error.message);
    return NextResponse.json({ 
      error: "FALHA_MOTOR_IA", 
      details: error.message 
    }, { status: 500 });
  }
}
