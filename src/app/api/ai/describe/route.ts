import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 30;

async function tryGenerate(model: any, content: any) {
  let retries = 3;
  let delay = 2000;
  
  while (retries > 0) {
    try {
      return await model.generateContent(content);
    } catch (err: any) {
      if (err.message.includes("503") || err.message.includes("Service Unavailable")) {
        await new Promise(res => setTimeout(res, delay));
        retries--;
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
  throw new Error("Servidores do Google ocupados.");
}

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();
    if (!apiKey) return NextResponse.json({ error: "ERRO_CONFIG" }, { status: 401 });

    const payload = await req.json();
    const { image } = payload;
    if (!image) return NextResponse.json({ error: "DADOS_AUSENTES" }, { status: 400 });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const modelParams = {
      systemInstruction: `Você é uma mestre joalheira e copywriter de luxo da Lapidado. 
      Sua missão é criar nomes e descrições únicas e irresistíveis. 
      
      REGRAS DE OURO:
      - NUNCA repita a mesma descrição para peças diferentes.
      - Use adjetivos variados e luxuosos (ex: magnético, sublime, ancestral, contemporâneo, celestial).
      - Se a peça for dourada, varie entre "Ouro 18k", "Banho Nobre", "Brilho Solar".
      - Se tiver pedras, varie entre "Zircônias Premium", "Cristais de Alta Lapidação", "Pontos de Luz".

      JSON OUTPUT:
      {"name": "Nome Curto e Impactante", "category": "CATEGORIA", "description": "3 frases magnéticas e diferentes de tudo."}`
    };

    let result;
    const generationConfig = {
      temperature: 0.9, // 🚀 Máxima criatividade para evitar repetições
      topP: 1,
      maxOutputTokens: 1000,
      responseMimeType: "application/json",
    };

    try {
      // 🚀 AGORA O FLASH É O PRINCIPAL (Velocidade Máxima)
      const modelFlash = genAI.getGenerativeModel({ ...modelParams, model: "gemini-flash-latest" });
      result = await tryGenerate(modelFlash, {
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig,
        safetySettings
      });
    } catch (e) {
      console.error("Flash falhou, tentando Pro como backup...");
      const modelPro = genAI.getGenerativeModel({ ...modelParams, model: "gemini-pro-latest" });
      result = await tryGenerate(modelPro, {
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig,
        safetySettings
      });
    }

    const response = await result.response;
    let aiText = response.text().trim();
    
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiText = jsonMatch[0];
    }

    try {
      const rawJson = JSON.parse(aiText);
      
      const clean = (txt: string) => {
        if (!txt) return "";
        return txt.toString()
          .replace(/json/gi, "")
          .replace(/```/gi, "")
          .replace(/Aqui está/gi, "")
          .replace(/Joia Identificada/gi, "")
          .replace(/\[|\]/g, "")
          .trim();
      };

      return NextResponse.json({
        name: clean(rawJson.name || rawJson.NAME || "Joia Exclusiva Lapidado"),
        category: clean(rawJson.category || rawJson.CATEGORY || "OUTROS").toUpperCase(),
        description: clean(rawJson.description || rawJson.DESCRIPTION || "")
      });
    } catch (e) {
      console.error("Erro no processamento da joia:", e);
      return NextResponse.json({
        name: "JOIA LAPIDADA",
        category: "OUTROS",
        description: "PEÇA EXCLUSIVA COM BANHO DE ALTA QUALIDADE E DESIGN REFINADO."
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "FALHA_MOTOR_IA", details: error.message }, { status: 500 });
  }
}
