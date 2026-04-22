import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * 💎 MOTOR LAPIDADO: VERSÃO ESTÁVEL v1
 * Forçando v1 para evitar o erro de 'Model Not Found' da v1beta.
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
    
    // 🔄 URL ESTÁVEL v1 (A prova de falhas)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analyze the jewellery. Return ONLY JSON: {\"name\": \"...\", \"category\": \"...\", \"description\": \"...\", \"material\": \"...\"}" },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }],
        generationConfig: { 
          temperature: 0.1, 
          maxOutputTokens: 400 
        }
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({ error: "ERRO_PARSE", raw: responseText.substring(0, 100) }, { status: 500 });
    }

    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      let aiText = data.candidates[0].content.parts[0].text.trim();
      const start = aiText.indexOf('{');
      const end = aiText.lastIndexOf('}');
      const finalJson = (start !== -1 && end !== -1) ? aiText.substring(start, end + 1) : aiText;
      return NextResponse.json(JSON.parse(finalJson));
    }

    return NextResponse.json({ 
      error: "ERRO_MOTOR_V1", 
      details: data.error?.message || "O Google recusou a conexão estável."
    }, { status: 400 });

  } catch (error: any) {
    console.error("ERRO CRÍTICO IA:", error.message);
    return NextResponse.json({ 
      error: "ERRO_MOTOR_FINAL", 
      details: error.message 
    }, { status: 500 });
  }
}
