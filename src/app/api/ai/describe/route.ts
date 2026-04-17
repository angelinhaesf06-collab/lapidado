import { NextResponse } from "next/server";

// 🚀 ACELERAÇÃO MÁXIMA: Usando Edge Runtime para resposta instantânea
export const runtime = 'edge';

// 💎 NEXUS: MOTOR DE IA LAPIDADO (Versão Otimizada para Performance)
export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('MISSING')) {
      return NextResponse.json({ error: "CONFIGURAÇÃO: Chave de IA não encontrada." }, { status: 401 });
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
            { text: "Você é um Copywriter Especialista em Vendas de Semijoias para o 'Catálogo Lapidado'. Analise a imagem e retorne um objeto JSON com: 1. 'name': Nome comercial forte (EM MAIÚSCULAS). 2. 'category': Categoria (Anéis, Colares, Brincos ou Pulseiras). 3. 'description': Descrição FOCO EM VENDA, destacando brilho e qualidade. 4. 'material': Banho real identificado (Ouro 18k, Prata 925 ou Ródio). Retorne APENAS o JSON puro, sem markdown." },
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

  } catch (error: any) {
    console.error("ERRO OPERACIONAL IA:", error.message);
    return NextResponse.json({ 
      error: "IA EM MANUTENÇÃO.", 
      details: error.message 
    }, { status: 503 });
  }
}
