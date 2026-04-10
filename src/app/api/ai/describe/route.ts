import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Nenhuma imagem fornecida" }, { status: 400 });
    }

    // Limpar o prefixo base64 se existir (ex: data:image/jpeg;base64,)
    const base64Data = image.split(",")[1] || image;

    // Usar o modelo flash avançado disponível na chave da usuária
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Você é um especialista em marketing de joias de luxo para o "Catálogo Lapidado".
      Analise a imagem desta semijoia e retorne OBRIGATORIAMENTE um objeto JSON com:
      1. "name": Um nome comercial sofisticado para a peça (ex: Colar Riviera Esmeralda).
      2. "category": A categoria (Anéis, Colares, Brincos ou Pulseiras).
      3. "description": Uma descrição luxuosa e sedutora, focada em brilho e exclusividade (mínimo 2 frases).
      4. "material": O banho da peça (ex: Ouro 18k, Prata 925 ou Ródio).

      IMPORTANTE: Retorne APENAS o JSON. Não use blocos de código markdown.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Tentar extrair apenas o conteúdo entre as chaves { } se a IA mandar texto extra
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;
    
    try {
      const aiData = JSON.parse(jsonString);
      return NextResponse.json(aiData);
    } catch (parseError) {
      console.error("Erro ao processar JSON da IA:", text);
      return NextResponse.json({ 
        name: "Joia Lapidada", 
        description: text, // Se falhar o JSON, manda o texto puro como descrição
        material: "Ouro/Prata" 
      });
    }
  } catch (error: any) {
    console.error("Erro na IA:", error);
    return NextResponse.json({ error: "Falha ao analisar a joia: " + error.message }, { status: 500 });
  }
}
