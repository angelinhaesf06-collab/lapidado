import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('MISSING')) {
      return NextResponse.json({ error: "Chave de IA não configurada na Vercel." }, { status: 401 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = image.split(",")[1] || image;
    const prompt = "Você é um especialista em semijoias. Analise a imagem e retorne um JSON com: 'name' (NOME DA JOIA EM MAIÚSCULAS), 'category' (Anéis, Brincos, Colares ou Pulseiras), 'description' (Descrição curta e luxuosa) e 'material' (Ouro 18k, Prata 925 ou Ródio). Retorne apenas o JSON.";

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    return NextResponse.json(JSON.parse(jsonMatch ? jsonMatch[0] : text));

  } catch (error: any) {
    console.error("ERRO IA:", error.message);
    return NextResponse.json({ 
      error: "O Google está processando muitas requisições ou sua chave expirou.",
      details: error.message 
    }, { status: 500 });
  }
}
