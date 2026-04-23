import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 30;

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
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    // 🚀 MOTOR LAPIDADO: GEMINI 2.5 FLASH (PLANO PAGO/DIAGNÓSTICO)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "Você é um robô de catálogo. Analise a joia e responda APENAS um objeto JSON válido com 'name', 'category' e 'description'.",
    });
    
    let result;
    try {
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: { 
          maxOutputTokens: 250, 
          temperature: 0.2
        },
        safetySettings
      });
      
      const response = await result.response;
      let aiText = response.text().trim();

      aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      const start = aiText.indexOf('{');
      const end = aiText.lastIndexOf('}');
      
      if (start === -1 || end === -1) {
        throw new Error("A IA não gerou um formato JSON válido.");
      }

      const cleanedJson = aiText.substring(start, end + 1);
      return NextResponse.json(JSON.parse(cleanedJson));

    } catch (err: any) {
      console.error("DETALHE DO ERRO GOOGLE:", err.message);
      // Retorna o erro real para sabermos o que está acontecendo
      return NextResponse.json({ 
        error: "FALHA_MOTOR_IA", 
        details: err.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ 
      error: "ERRO_CRITICO", 
      details: error.message 
    }, { status: 500 });
  }
}
