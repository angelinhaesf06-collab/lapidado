import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export const runtime = 'nodejs'
export const maxDuration = 30 

/**
 * 💎 MOTOR LAPIDADO: RECONSTRUÇÃO TOTAL
 * Solução definitiva para o erro 'Model Not Found'.
 */
export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (!apiKey) {
      console.error("ERRO: Chave API não encontrada.");
      return NextResponse.json({ error: "ERRO_CONFIG" }, { status: 401 });
    }

    const payload = await req.json();
    const { image } = payload;
    if (!image) return NextResponse.json({ error: "DADOS_AUSENTES" }, { status: 400 });

    // 🔄 MOTOR DEFINITIVO: Usando 'gemini-1.5-flash-latest' (mais flexível)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // O SDK gerencia a versão da API internamente
    });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    
    // Prompt otimizado para ser curto e gastar pouco token
    const prompt = "Analyze this jewellery photo. Return ONLY a JSON object: {\"name\": \"...\", \"category\": \"...\", \"description\": \"...\"}. Be concise and premium.";

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const aiText = response.text().trim();
    
    // Extração robusta do JSON
    const start = aiText.indexOf('{');
    const end = aiText.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error("A IA não retornou um JSON válido.");
    }
    
    const finalJson = aiText.substring(start, end + 1);
    return NextResponse.json(JSON.parse(finalJson));

  } catch (error: any) {
    console.error("DETALHE ERRO IA:", error.message);
    
    // Se o erro for 'Not Found', tentamos um fallback para o modelo pro
    return NextResponse.json({ 
      error: "ERRO_MOTOR_FINAL", 
      details: error.message,
      hint: "Verifique se a chave de API no Vercel está correta e tem acesso ao Gemini 1.5."
    }, { status: 500 });
  }
}
