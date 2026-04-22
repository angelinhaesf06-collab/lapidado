import { NextResponse } from "next/server";

export const runtime = 'nodejs';

/**
 * 💎 MOTOR LAPIDADO: IGNICAO DEFINITIVA 2026
 * Forçando v1beta e motor 1.5-flash para máxima compatibilidade.
 */
export async function POST(req: Request) {
  try {
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (!geminiKey) {
      return NextResponse.json({ error: "FALHA_IGNICAO_2026", details: "Chave GEMINI_API_KEY não encontrada." }, { status: 401 });
    }

    const bodyText = await req.text();
    if (!bodyText) return NextResponse.json({ error: "FALHA_IGNICAO_2026", details: "Corpo vazio." }, { status: 400 });

    const payload = JSON.parse(bodyText);
    const { image } = payload;
    if (!image) return NextResponse.json({ error: "FALHA_IGNICAO_2026", details: "Sem imagem." }, { status: 400 });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    
    // 🔄 CICLO: v1beta + gemini-1.5-flash (O ID mais compatível da história)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analyze the jewellery. Return ONLY JSON: {\"name\": \"...\", \"category\": \"...\", \"description\": \"...\", \"material\": \"...\"}" },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({ error: "FALHA_IGNICAO_2026", details: "Erro no parse do Google.", raw: responseText.substring(0, 50) }, { status: 500 });
    }

    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      let aiText = data.candidates[0].content.parts[0].text.trim();
      const start = aiText.indexOf('{');
      const end = aiText.lastIndexOf('}');
      const finalJson = (start !== -1 && end !== -1) ? aiText.substring(start, end + 1) : aiText;
      return NextResponse.json(JSON.parse(finalJson));
    }

    return NextResponse.json({ 
      error: "FALHA_IGNICAO_2026", 
      details: data.error?.message || "O Google recusou a conexão.",
      status: response.status
    }, { status: 400 });

  } catch (error: unknown) {
    return NextResponse.json({ 
      error: "FALHA_IGNICAO_2026", 
      details: (error as Error).message 
    }, { status: 500 });
  }
}
