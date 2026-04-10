import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Função de espera (sleep) para o retry
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: "Nenhuma imagem fornecida" }, { status: 400 });
    }

    const base64Data = image.split(",")[1] || image;
    const prompt = `
      Você é um Copywriter Especialista em Vendas de Semijoias para o "Catálogo Lapidado".
      Analise a imagem e retorne um objeto JSON com:
      1. "name": Nome comercial forte e direto.
      2. "category": A categoria (Anéis, Colares, Brincos ou Pulseiras).
      3. "description": Descrição FOCO EM VENDA, destacando brilho e qualidade. (Mínimo 2 frases curtas).
      4. "material": O banho real identificado (Ouro 18k, Prata 925 ou Ródio).
      Retorne APENAS o JSON.
    `;

    const models = ["gemini-1.5-flash", "gemini-2.0-flash"];
    let lastError = null;

    for (const modelName of models) {
      // MÁGICA NEXUS: RETRY AUTOMÁTICO (3 Tentativas por modelo)
      for (let i = 0; i < 3; i++) {
        try {
          console.log(`💎 NEXUS: TENTATIVA ${i+1} COM MODELO ${modelName}...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          
          const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
          ]);

          const response = await result.response;
          const text = response.text();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : text;
          return NextResponse.json(JSON.parse(jsonString));

        } catch (err: any) {
          lastError = err;
          const isOverloaded = err.message?.includes("503") || err.message?.includes("overloaded");
          
          if (isOverloaded && i < 2) {
            console.warn(`⚠️ NEXUS: GOOGLE SOBRECARREGADO. ESPERANDO 2s PARA TENTAR NOVAMENTE...`);
            await sleep(2000); // Espera 2 segundos antes da próxima tentativa
            continue;
          }
          break; // Se não for erro de carga ou acabaram os retries, pula pro próximo modelo
        }
      }
    }

    throw lastError || new Error("Falha total na comunicação com a IA.");

  } catch (error: any) {
    console.error("Erro Final na IA:", error);
    return NextResponse.json({ 
      error: "ALTA DEMANDA NO GOOGLE.",
      details: error.message 
    }, { status: 503 });
  }
}
