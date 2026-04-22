import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const maxDuration = 45;

/**
 * 💎 MOTOR LAPIDADO: ROMANEIO v1 ESTÁVEL
 */
export async function POST(req: Request) {
  try {
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (!geminiKey) {
      return NextResponse.json({ error: "ERRO_CONFIG", details: "Chave API ausente." }, { status: 401 });
    }

    const payload = await req.json();
    const { image } = payload;
    if (!image) return NextResponse.json({ error: "ERRO_IA_ROMANEIO", details: "Arquivo não fornecido." }, { status: 400 });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    // 🔄 URL ESTÁVEL v1
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    const prompt = `
      Você é um assistente especialista em joalheria da marca LAPIDADO. 
      Analise o romaneio e extraia os itens.
      Retorne APENAS o array JSON: [{"name": "ITEM", "quantity": 1, "unitCost": 0.00}]
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }],
        generationConfig: { temperature: 0.1 }
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({ error: "ERRO_PARSE", details: "Falha ao ler resposta do Google." }, { status: 500 });
    }

    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      let aiText = data.candidates[0].content.parts[0].text.trim();
      const start = aiText.indexOf('[');
      const end = aiText.lastIndexOf(']');
      
      if (start === -1) throw new Error("A IA não conseguiu gerar a lista.");

      const jsonStr = aiText.substring(start, end + 1);
      return NextResponse.json(JSON.parse(jsonStr));
    }

    return NextResponse.json({ 
      error: "ERRO_IA_ROMANEIO", 
      details: data.error?.message || "O motor v1 falhou no romaneio." 
    }, { status: 500 });

  } catch (error: any) {
    console.error("ERRO ROMANEIO:", error.message);
    return NextResponse.json({ 
      error: "ERRO_IA_ROMANEIO", 
      details: error.message 
    }, { status: 500 });
  }
}
