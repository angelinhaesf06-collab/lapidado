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

    const models = ["gemini-2.0-flash-lite", "gemini-flash-lite-latest", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError = null;

    for (const modelName of models) {
      // MÁGICA NEXUS: RETRY AUTOMÁTICO (2 Tentativas por modelo)
      for (let i = 0; i < 2; i++) {
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
          const isNotFound = err.message?.includes("404") || err.message?.includes("not found");
          
          if (isNotFound) {
            console.warn(`⚠️ NEXUS: MODELO ${modelName} NÃO ENCONTRADO (404). TENTANDO PRÓXIMO...`);
            break; // Pula imediatamente para o próximo modelo se for 404
          }

          if (isOverloaded && i < 1) {
            console.warn(`⚠️ NEXUS: MODELO ${modelName} SOBRECARREGADO (503). ESPERANDO 1s...`);
            await sleep(1000); // Espera 1 segundo
            continue;
          }
          
          console.error(`❌ NEXUS: ERRO NO MODELO ${modelName}:`, err.message);
          break; // Se for outro erro ou acabaram retries, pula pro próximo modelo
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
