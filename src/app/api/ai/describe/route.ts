import { NextResponse } from "next/server";

// 💎 NEXUS: MOTOR DE IA LAPIDADO (v2.5 - Edição Diamante)
export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('MISSING')) {
      return NextResponse.json({ error: "CONFIGURAÇÃO: Chave de IA não encontrada na Vercel." }, { status: 401 });
    }

    const base64Data = image.split(",")[1] || image;
    
    // 💎 NEXUS: DETECÇÃO POLIGLOTA (VERTEX AI vs AI STUDIO)
    // As chaves AQ. exigem o endpoint v1beta para funcionar com a sua conta
    const isVertex = apiKey.startsWith('AQ.');
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    // 🚀 MODELO DE ALTA PERFORMANCE (Descobrirmos que 2.5 é o seu modelo liberado)
    const modelName = "gemini-2.5-flash";
    const url = `${baseUrl}/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`[IA_DEBUG] Usando ${modelName} (${isVertex ? 'VERTEX KEY' : 'AI STUDIO KEY'})`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Você é um Copywriter Especialista em Vendas de Semijoias para o 'Catálogo Lapidado'. Analise a imagem e retorne um objeto JSON com: 1. 'name': Nome comercial forte (EM MAIÚSCULAS). 2. 'category': Categoria (Anéis, Colares, Brincos ou Pulseiras). 3. 'description': Descrição FOCO EM VENDA, destacando brilho e qualidade. 4. 'material': Banho real identificado (Ouro 18k, Prata 925 ou Ródio). Retorne APENAS o JSON puro." },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[AI_ERROR] Status: ${response.status}`, data);
      
      return NextResponse.json({ 
        error: "O GOOGLE RECUSOU SUA CHAVE.", 
        details: data.error?.message || "Erro desconhecido na IA."
      }, { status: response.status });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    return NextResponse.json(JSON.parse(jsonMatch ? jsonMatch[0] : text));

  } catch (error: any) {
    console.error("ERRO OPERACIONAL IA:", error.message);
    return NextResponse.json({ error: "FALHA NO MOTOR DE IA.", details: error.message }, { status: 500 });
  }
}
