import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * 💎 MOTOR LAPIDADO: VERSÃO FINAL 2026.4
 * Sistema 100% estabilizado e otimizado.
 */
export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (!apiKey) {
      return NextResponse.json({ error: "ERRO_CONFIG", details: "Chave API ausente." }, { status: 401 });
    }

    const payload = await req.json();
    const { image } = payload;
    if (!image) return NextResponse.json({ error: "DADOS_AUSENTES" }, { status: 400 });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    
    // 🔄 URL DIRETA: O método mais estável que confirmamos funcionar no seu projeto
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = "Jewellery analysis. Return ONLY JSON: {\"name\": \"...\", \"category\": \"...\", \"description\": \"...\"}. Be premium.";

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
        generationConfig: { 
          temperature: 0.2, 
          maxOutputTokens: 300,
          topP: 0.8,
          topK: 40
        }
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({ error: "ERRO_PARSE_GOOGLE", raw: responseText.substring(0, 100) }, { status: 500 });
    }

    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      let aiText = data.candidates[0].content.parts[0].text.trim();
      
      // Extração robusta de JSON (Nexus 2026)
      const start = aiText.indexOf('{');
      const end = aiText.lastIndexOf('}');
      const finalJson = (start !== -1 && end !== -1) ? aiText.substring(start, end + 1) : aiText;
      
      return NextResponse.json(JSON.parse(finalJson));
    }

    // Caso o Google retorne um erro específico (como 404, 403, etc)
    return NextResponse.json({ 
      error: "ERRO_GOOGLE_API", 
      details: data.error?.message || "O motor v1 recusou a chamada.",
      status: response.status
    }, { status: response.status || 400 });

  } catch (error: any) {
    console.error("ERRO CRÍTICO NO MOTOR:", error.message);
    return NextResponse.json({ 
      error: "FALHA_TOTAL_MOTOR", 
      details: error.message 
    }, { status: 500 });
  }
}
