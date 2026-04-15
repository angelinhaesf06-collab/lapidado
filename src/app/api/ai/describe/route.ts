import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 💎 NEXUS: INICIALIZAÇÃO DE ELITE (Forçando Versão Estável v1)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// Nota: Se o SDK não suportar a opção apiVersion no construtor, 
// ele usará o padrão da versão instalada.

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
      1. "name": Nome comercial forte e direto (EM MAIÚSCULAS).
      2. "category": A categoria (Anéis, Colares, Brincos ou Pulseiras).
      3. "description": Descrição FOCO EM VENDA, destacando brilho e qualidade. (Mínimo 2 frases curtas).
      4. "material": O banho real identificado (Ouro 18k, Prata 925 ou Ródio).
      Retorne APENAS o JSON puro, sem markdown.
    `;

    // 🚀 SEQUÊNCIA DE MODELOS DE ALTA PERFORMANCE (Nomes corrigidos e atualizados)
    const models = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro-latest"];
    let lastError = null;

    for (const modelName of models) {
      for (let i = 0; i < 2; i++) {
        try {
          console.log(`💎 NEXUS: DISPARANDO ${modelName} (TENTATIVA ${i+1})...`);
          
          // O segredo está em garantir o nome do modelo sem prefixos extras se o SDK já os colocar
          const model = genAI.getGenerativeModel({ model: modelName });
          
          const result = await model.generateContent([
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
          ]);

          const response = await result.response;
          const text = response.text();
          
          // Extração limpa de JSON
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : text;
          return NextResponse.json(JSON.parse(jsonString));

        } catch (err) {
          lastError = err as Error;
          const msg = (err as Error).message.toLowerCase();
          
          if (msg.includes("404") || msg.includes("not found")) {
            console.warn(`⚠️ NEXUS: ${modelName} NÃO LOCALIZADO. PULANDO...`);
            break;
          }

          if ((msg.includes("503") || msg.includes("overloaded")) && i < 1) {
            console.warn(`⚠️ NEXUS: CANAL ${modelName} CONGESTIONADO. RECALIBRANDO EM 2s...`);
            await sleep(2000);
            continue;
          }
          
          console.error(`❌ NEXUS: FALHA NO CANAL ${modelName}:`, (err as Error).message);
          break;
        }
      }
    }

    throw lastError || new Error("IA INDISPONÍVEL NO MOMENTO.");

  } catch (error) {
    const err = error as Error;
    console.error("ERRO OPERACIONAL IA:", err.message);
    return NextResponse.json({ 
      error: "SISTEMA DE IA EM MANUTENÇÃO NO GOOGLE.",
      details: err.message 
    }, { status: 503 });
  }
}
