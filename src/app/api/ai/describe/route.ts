import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * 💎 MOTOR LAPIDADO: REPARO DE EMERGÊNCIA
 * Mudando para v1beta para resolver o erro 404 do modelo Flash.
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
    
    // 🔄 TENTATIVA COM v1beta (Mais comum para o modelo Flash em contas gratuitas)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = "Jewellery analysis. Return ONLY JSON: {\"name\": \"...\", \"category\": \"...\", \"description\": \"...\"}.";

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
          temperature: 0.1, 
          maxOutputTokens: 300
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

    // Se o v1beta falhar, o erro será exibido aqui com detalhes
    return NextResponse.json({ 
      error: "ERRO_MOTOR_BETA", 
      details: data.error?.message || "O motor v1beta também recusou a chamada.",
      google_error_code: data.error?.code,
      status: response.status
    }, { status: response.status || 400 });

  } catch (error: any) {
    return NextResponse.json({ 
      error: "FALHA_CRITICA", 
      details: error.message 
    }, { status: 500 });
  }
}
