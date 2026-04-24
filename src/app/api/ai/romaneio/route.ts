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
    const systemInstruction = "Você é um robô extrator. Retorne APENAS um array JSON: [{\"name\": \"...\", \"quantity\": 0, \"unitCost\": 0.0}]";

    let result;
    try {
      // 🚀 1ª OPÇÃO: Gemini 2.5 Flash
      const model25 = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction });
      result = await model25.generateContent({
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.1 }
      });
    } catch (e) {
      console.error("Gemini 2.5 Flash falhou no romaneio, tentando Pro...");
      // 🚀 2ª OPÇÃO: Gemini 2.5 Pro
      const model25pro = genAI.getGenerativeModel({ model: "gemini-2.5-pro", systemInstruction });
      result = await model25pro.generateContent({
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.1 }
      });
    }

    const response = await result.response;
    const aiText = response.text().trim();
    const jsonMatch = aiText.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
       return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    
    throw new Error("A IA não gerou a lista.");

  } catch (error: any) {
    return NextResponse.json({ error: "ERRO_IA_ROMANEIO", details: error.message }, { status: 500 });
  }
}
