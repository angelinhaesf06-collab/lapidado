import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (!geminiKey) {
      return NextResponse.json({ error: "ERRO_CONFIG" }, { status: 401 });
    }

    const payload = await req.json();
    const { image } = payload;
    if (!image) return NextResponse.json({ error: "ERRO_IA_ROMANEIO" }, { status: 400 });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const genAI = new GoogleGenerativeAI(geminiKey);
    const systemInstruction = "Você é um robô extrator de dados de joias. Retorne APENAS o array JSON: [{\"name\": \"...\", \"quantity\": 0, \"unitCost\": 0.0}]. Não escreva textos explicativos.";

    let result;
    try {
      // 🚀 MOTOR 2.0 EXPERIMENTAL
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp", systemInstruction });
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.1 }
      });
    } catch (e) {
      console.error("Gemini 2.0 Exp falhou, tentando Pro...");
      // 🚀 BACKUP 2.0 PRO
      const modelPro = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05", systemInstruction });
      result = await modelPro.generateContent({
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.1 }
      });
    }

    const response = await result.response;
    const aiText = response.text().trim();
    const jsonMatch = aiText.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
       return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    
    throw new Error("A IA não conseguiu ler o romaneio.");

  } catch (error: any) {
    return NextResponse.json({ error: "ERRO_IA_ROMANEIO", details: error.message }, { status: 500 });
  }
}
