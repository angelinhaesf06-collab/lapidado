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

    // 🚀 MOTOR LAPIDADO: FORÇANDO v1 (ESTÁVEL)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "Você é um assistente de joalheria. Descreva a joia da foto. Retorne APENAS JSON: {\"name\": \"...\", \"category\": \"...\", \"description\": \"...\"}",
    }, { apiVersion: 'v1' });
    
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.1 },
        safetySettings
      });
      
      const response = await result.response;
      let aiText = response.text().trim();

      const start = aiText.indexOf('{');
      const end = aiText.lastIndexOf('}');
      
      if (start !== -1 && end !== -1) {
        const cleanedJson = aiText.substring(start, end + 1);
        try {
          return NextResponse.json(JSON.parse(cleanedJson));
        } catch (e) {}
      }

      return NextResponse.json({
        name: "JOIA IDENTIFICADA",
        category: "OUTROS",
        description: aiText.substring(0, 300)
      });

    } catch (err: any) {
      return NextResponse.json({ error: "FALHA_MOTOR_IA", details: err.message }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "ERRO_SISTEMA", details: error.message }, { status: 500 });
  }
}
