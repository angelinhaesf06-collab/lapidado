import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('MISSING')) {
      return NextResponse.json({ error: "CONFIGURAÇÃO: Chave de IA não encontrada na Vercel." }, { status: 401 });
    }

    const base64Data = image.split(",")[1] || image;
    
    // 💎 NEXUS: DETECÇÃO POLIGLOTA (VERTEX AI vs AI STUDIO)
    const isVertex = apiKey.startsWith('AQ.');
    const baseUrl = isVertex 
      ? "https://aiplatform.googleapis.com/v1" // Google Cloud (Vertex Express Mode)
      : "https://generativelanguage.googleapis.com/v1beta"; // AI Studio (Standard)

    const url = `${baseUrl}/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    console.log(`[IA_DEBUG] Usando endpoint: ${isVertex ? 'VERTEX AI (GCP)' : 'AI STUDIO'}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Você é um copywriter de joias de luxo. Analise a imagem e retorne APENAS um JSON: {\"name\": \"NOME EM MAIÚSCULAS\", \"category\": \"Categoria\", \"description\": \"Descrição luxuosa curta\", \"material\": \"Ouro 18k, Prata ou Ródio\"}" },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorStatus = response.status;
      const errorCode = (errorStatus === 401 || errorStatus === 403) ? 'CHAVE_SEM_PERMISSAO' : 
                        (errorStatus === 404) ? 'URL_ESTRUTURAL_ERRADA' : 'ERRO_DESCONHECIDO';

      console.error(`[AI_ERROR] [${errorCode}] Status: ${errorStatus}`, data);
      
      return NextResponse.json({ 
        error: "O GOOGLE RECUSOU SUA CHAVE.", 
        diagnostic: errorCode,
        details: data.error?.message || "Verifique se a API Gemini está ativada no projeto correspondente."
      }, { status: response.status });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    return NextResponse.json(JSON.parse(jsonMatch ? jsonMatch[0] : text));

  } catch (error: any) {
    return NextResponse.json({ error: "FALHA NO MOTOR DE IA.", details: error.message }, { status: 500 });
  }
}
