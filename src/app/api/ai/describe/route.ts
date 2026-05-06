import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { image, style } = await req.json();
    const apiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (!apiKey) {
      return NextResponse.json({ error: "Chave da IA não configurada." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🚀 MOTOR DE ÚLTIMA GERAÇÃO: Gemini 2.0 Flash Lite
    // O modelo mais recente e inteligente do Google para aplicações mobile
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite-preview-02-05",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `
      ATUE COMO UM ESPECIALISTA EM JOALHERIA DE LUXO E MARKETING.
      ANALISE A FOTO DESTA JOIA E GERE OS DADOS PARA O CATÁLOGO.

      ESTILO DESEJADO: ${style === 'luxo' ? 'SOFISTICADO, POÉTICO E EXCLUSIVO' : style === 'venda' ? 'PERSUASIVO, COM GATILHOS DE DESEJO' : 'DIRETO, OBJETIVO E TÉCNICO'}.

      REGRAS OBRIGATÓRIAS:
      1. NOME: Curto, em MAIÚSCULAS, evocando elegância.
      2. DESCRIÇÃO: Texto envolvente focado no brilho, banho e design.
      3. CATEGORIA: Escolha uma entre [ANEL, BRINCO, COLIER, PULSEIRA, CONJUNTO, ACESSÓRIO].
      
      RETORNE APENAS UM JSON PURO:
      {
        "name": "NOME DA JOIA",
        "description": "Texto da descrição aqui...",
        "category": "CATEGORIA"
      }
    `;

    // Converte base64 para o formato do Gemini
    const imageData = image.split(",")[1];
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Limpeza de possíveis marcações de markdown do JSON
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return NextResponse.json(JSON.parse(jsonStr));

  } catch (err) {
    console.error("Erro na IA:", err);
    return NextResponse.json({ error: "Falha ao processar imagem." }, { status: 500 });
  }
}
