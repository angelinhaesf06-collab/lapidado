import { NextResponse } from "next/server";

// 🚀 ACELERAÇÃO MÁXIMA: Usando Edge Runtime para resposta instantânea
export const runtime = 'edge';

// 💎 NEXUS: MOTOR DE IA LAPIDADO (Versão Otimizada para Performance)
export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // 💎 NEXUS: BUSCA EXAUSTIVA POR CREDENCIAIS (Resiliência Vercel)
    const apiKey = 
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
      process.env.GEMINI_API_KEY || 
      process.env.gemini_api_key ||
      process.env.NEXT_PUBLIC_GEMINI_KEY;

    if (!apiKey || apiKey.length < 10) {
      console.error("❌ ERRO CRÍTICO: Nenhuma variação de GEMINI_API_KEY encontrada no ambiente Vercel.");
      return NextResponse.json({ 
        error: "CONFIGURAÇÃO: Chave de IA não encontrada no servidor.",
        details: "Certifique-se de que a variável NEXT_PUBLIC_GEMINI_API_KEY está configurada para ALL ENVIRONMENTS na Vercel e faça um REDEPLOY."
      }, { status: 401 });
    }

    const base64Data = image.split(",")[1] || image;
    
    // O modelo gemini-flash-latest é o único com cota liberada para chaves AQ.
    const modelName = "gemini-flash-latest";
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    console.log(`💎 NEXUS: Processando com ${modelName}...`);
    
    const url = `${baseUrl}/models/${modelName}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Você é um Copywriter Especialista em Vendas de Semijoias para o 'Catálogo Lapidado'. Analise a imagem e retorne um objeto JSON com: 1. 'name': Nome comercial curto e direto (MÁX. 30 caracteres, EM MAIÚSCULAS). 2. 'category': Categoria (Anéis, Colares, Brincos ou Pulseiras). 3. 'description': Descrição CURTA e IMPACTANTE (MÁX. 120 caracteres), foco no brilho e elegância. 4. 'material': Banho real identificado (Ouro 18k, Prata 925 ou Ródio). Retorne APENAS o JSON puro, sem markdown ou explicações." },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log(`✅ SUCESSO: A IA descreveu a joia com perfeição!`);
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return NextResponse.json(JSON.parse(jsonMatch ? jsonMatch[0] : text));
    }

    console.error(`❌ ERRO NO MOTOR DE IA:`, data.error?.message || "Erro desconhecido");
    throw new Error(data.error?.message || "O Google recusou o processamento da imagem.");

  } catch (error: unknown) {
    const err = error as Error;
    console.error("ERRO OPERACIONAL IA:", err.message);
    return NextResponse.json({ 
      error: "IA EM MANUTENÇÃO.", 
      details: err.message 
    }, { status: 503 });
  }
}
