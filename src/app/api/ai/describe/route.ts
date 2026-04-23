import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * 💎 MOTOR LAPIDADO: ESTABILIZAÇÃO VIA SDK OFICIAL
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
    
    // 🚀 MOTOR LAPIDADO: GEMINI 2.5 FLASH (OTIMIZADO PARA CUSTO)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { maxOutputTokens: 150, temperature: 0.4 }
    });
    
    let result;
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        result = await model.generateContent([
          "Descreva esta joia. Retorne APENAS um JSON: {\"name\": \"NOME\", \"category\": \"CATEGORIA\", \"description\": \"3 frases curtas e luxuosas\"}.",
          { inlineData: { mimeType, data: base64Data } }
        ]);
        break; // Sucesso! Sai do loop.
      } catch (err: any) {
        retries--;
        if (retries === 0) throw err; // Se acabarem as tentativas, lança o erro.
        console.warn(`⚠️ IA Ocupada (503). Tentando novamente em ${delay}ms... Restam ${retries} tentativas.`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Aumento exponencial do tempo de espera (Backoff)
      }
    }

    const response = await result!.response;
    const aiText = response.text().trim();

    // Limpeza de Markdown (caso a IA coloque ```json ...)
    const start = aiText.indexOf('{');
    const end = aiText.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new Error("Resposta da IA não contém JSON válido: " + aiText);
    }
    const finalJson = aiText.substring(start, end + 1);
    
    return NextResponse.json(JSON.parse(finalJson));

  } catch (error: any) {
    console.error("ERRO CRÍTICO IA:", error.message);
    return NextResponse.json({ 
      error: "FALHA_MOTOR_IA", 
      details: error.message 
    }, { status: 500 });
  }
}
