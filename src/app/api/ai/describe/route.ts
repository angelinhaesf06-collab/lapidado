import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 💎 NEXUS: INICIALIZAÇÃO DE ELITE (Suporte a chaves AIza e AQ)
const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

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

    // 🚀 SEQUÊNCIA DE MODELOS OFICIAIS (Versões Estáveis e Atuais)
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
    let lastError = null;

    for (const modelName of models) {
      for (let i = 0; i < 3; i++) { // Aumentado para 3 tentativas
        try {
          console.log(`💎 NEXUS: DISPARANDO ${modelName} (TENTATIVA ${i+1})...`);
          
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
          
          // Se o modelo não existir no projeto/região, pula para o próximo da lista
          if (msg.includes("404") || msg.includes("not found") || msg.includes("model")) {
            console.warn(`⚠️ NEXUS: ${modelName} NÃO DISPONÍVEL. PULANDO...`);
            break; 
          }

          // Se estiver sobrecarregado (503 ou 429), espera um pouco mais a cada vez
          if ((msg.includes("503") || msg.includes("overloaded") || msg.includes("429")) && i < 2) {
            const waitTime = (i + 1) * 3000; // 3s, 6s...
            console.warn(`⚠️ NEXUS: CANAL ${modelName} CONGESTIONADO. ESPERANDO ${waitTime/1000}s...`);
            await sleep(waitTime);
            continue;
          }
          
          console.error(`❌ NEXUS: FALHA NO CANAL ${modelName}:`, (err as Error).message);
          break; // Se deu outro erro (ex: chave inválida), pula o modelo
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
