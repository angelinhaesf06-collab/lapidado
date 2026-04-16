import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 💎 NEXUS: INICIALIZAÇÃO DE ELITE (Suporte a chaves AIza e AQ)
const apiKey = process.env.GEMINI_API_KEY!;

// Função para identificar o tipo de chave nos logs (sem expor a chave inteira)
const logKeyType = (key: string) => {
  if (!key) return "CHAVE_AUSENTE";
  if (key.startsWith("AIza")) return "AI_STUDIO (AIza)";
  if (key.startsWith("AQ")) return "GOOGLE_CLOUD (AQ)";
  return "TIPO_DESCONHECIDO";
};

console.log(`📡 NEXUS: Carregando motor de IA com chave tipo ${logKeyType(apiKey)}`);

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

    // 🚀 SEQUÊNCIA DE MODELOS RESILIENTE (Cascata Solicitada)
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro-vision"];
    let lastError: any = null;

    for (const modelName of models) {
      for (let i = 0; i < 2; i++) { // 2 tentativas por modelo
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

        } catch (err: any) {
          lastError = err;
          const errorMsg = err.message || "";
          const errorStatus = err.status || "";
          const errorReason = err.reason || "";
          
          console.error(`❌ NEXUS: FALHA NO CANAL ${modelName}:`, errorMsg);

          // Auditoria de Erros Específicos
          if (errorMsg.includes("billing") || errorMsg.includes("quota") || errorMsg.includes("402")) {
            console.error("🚨 ALERTA CRÍTICO: BILLING_DISABLED ou Cota Excedida.");
          } else if (errorMsg.includes("API key not valid") || errorMsg.includes("expired") || errorMsg.includes("401")) {
            console.error("🚨 ALERTA CRÍTICO: API_KEY_EXPIRED ou Inválida.");
          } else if (errorMsg.includes("location") || errorMsg.includes("region") || errorMsg.includes("supported")) {
            console.error("🚨 ALERTA CRÍTICO: REGION_NOT_SUPPORTED.");
          }

          // Se o modelo não existir ou não for suportado, pula para o próximo
          if (errorMsg.includes("404") || errorMsg.includes("not found") || errorMsg.includes("not supported")) {
            console.warn(`⚠️ NEXUS: ${modelName} NÃO DISPONÍVEL NESTA CONTA/REGIÃO. PULANDO...`);
            break; 
          }

          // Retry apenas para sobrecarga
          if (errorMsg.includes("503") || errorMsg.includes("overloaded") || errorMsg.includes("429")) {
            const waitTime = (i + 1) * 2000;
            await sleep(waitTime);
            continue;
          }
          
          break; // Se deu outro erro grave, pula o modelo
        }
      }
    }

    // Se todos os modelos falharem, reporta o último erro com diagnóstico
    let diagnostic = "IA_OFFLINE";
    const msg = lastError?.message || "";
    if (msg.includes("billing")) diagnostic = "BILLING_DISABLED";
    if (msg.includes("API key")) diagnostic = "API_KEY_EXPIRED";
    if (msg.includes("location") || msg.includes("region")) diagnostic = "REGION_NOT_SUPPORTED";

    return NextResponse.json({ 
      error: "SISTEMA DE IA EM MANUTENÇÃO.",
      diagnostic,
      details: msg 
    }, { status: 503 });

  } catch (error: any) {
    console.error("ERRO OPERACIONAL IA:", error.message);
    return NextResponse.json({ 
      error: "FALHA CRÍTICA NO MOTOR DE IA.",
      details: error.message 
    }, { status: 500 });
  }
}
