import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    // 💎 NEXUS: Voltando para o 1.5-flash estável (v1) que é mais obediente a esquemas JSON
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "Você é um robô. Responda APENAS JSON puro. Nunca use blocos de código ou texto. Formato: {\"name\": \"...\", \"category\": \"...\", \"description\": \"...\"}",
    }, { apiVersion: "v1" });
    
    let result;
    try {
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: { 
          maxOutputTokens: 200, 
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });
    } catch (err: any) {
      console.error("ERRO CHAMADA GEMINI:", err.message);
      throw new Error("A IA está ocupada ou a imagem foi recusada. Tente novamente.");
    }

    const response = await result.response;
    let aiText = response.text().trim();

    // 💎 NEXUS: LIMPEZA ULTRA-ROBUSTA
    // Se a IA mandou Markdown (```json ... ```), nós removemos
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

    const start = aiText.indexOf('{');
    const end = aiText.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      console.error("CONTEÚDO ESTRANHO DA IA:", aiText);
      throw new Error("A IA não gerou um formato válido. Tente outra foto.");
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
