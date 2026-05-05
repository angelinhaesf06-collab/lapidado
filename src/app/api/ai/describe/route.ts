import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, Content, GenerationConfig, SafetySetting } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 30;

async function tryGenerate(model: GenerativeModel, content: { contents: Content[], generationConfig: GenerationConfig, safetySettings: SafetySetting[] }) {
  let retries = 1; // 🚀 Reduzido para 1 tentativa para não travar a tela
  const delay = 1000;
  
  while (retries >= 0) {
    try {
      return await model.generateContent(content);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if ((message.includes("503") || message.includes("Service Unavailable")) && retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        retries--;
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
    const { image, mode = 'LUXO' } = payload;
    if (!image) return NextResponse.json({ error: "DADOS_AUSENTES" }, { status: 400 });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const safetySettings: SafetySetting[] = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const modelParams = {
      systemInstruction: `Você é uma mestre joalheira e copywriter de luxo da Lapidado. 
      Sua missão é criar nomes e descrições para semijoias baseadas no estilo solicitado.
      
      ESTILO SELECIONADO: ${mode}

      DIRETRIZES POR ESTILO:
      - SIMPLES: Texto direto, focado na peça, sem muitos adjetivos.
      - LUXO: Texto poético, focado em exclusividade, brilho e status.
      - VENDA: Texto focado em benefícios, desejo de compra e gatilhos mentais.

      REGRAS CRÍTICAS:
      - NUNCA use a frase "Joia lapidada".
      - Nomes: Curtos e elegantes.
      - JSON OUTPUT: {"name": "Nome", "category": "CATEGORIA", "description": "Descrição baseada no estilo ${mode}"}`
    };

    let result;
    const generationConfig: GenerationConfig = {
      temperature: 0.9,
      topP: 1,
      maxOutputTokens: 1000,
      responseMimeType: "application/json",
    };

    try {
      // 🚀 MOTOR FLASH LITE LATEST: Velocidade extrema e inteligência moderna
      const modelFlash = genAI.getGenerativeModel({ ...modelParams, model: "gemini-flash-lite-latest" });
      result = await tryGenerate(modelFlash, {
        contents: [{ role: 'user', parts: [
          { text: "Analise esta joia e descreva em JSON conforme as instruções." },
          { inlineData: { mimeType, data: base64Data } }
        ] }],
        generationConfig,
        safetySettings
      });
    } catch (err: any) {
      console.error("Erro no Flash Lite, tentando Flash 1.5 como backup:", err.message);
      const modelVision = genAI.getGenerativeModel({ ...modelParams, model: "gemini-1.5-flash" });
      result = await tryGenerate(modelVision, {
        contents: [{ role: 'user', parts: [
          { text: "Analise esta joia e descreva em JSON." },
          { inlineData: { mimeType, data: base64Data } }
        ] }],
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
      const rawJson = JSON.parse(aiText) as { name?: string, NAME?: string, category?: string, CATEGORY?: string, description?: string, DESCRIPTION?: string };
      
      const clean = (txt: string | undefined) => {
        if (!txt) return "";
        return txt.toString()
          .replace(/json/gi, "")
          .replace(/```/gi, "")
          .replace(/Aqui está/gi, "")
          .replace(/\[|\]/g, "")
          .trim();
      };

      return NextResponse.json({
        name: clean(rawJson.name || rawJson.NAME || "Peça Nobre Lapidado"),
        category: clean(rawJson.category || rawJson.CATEGORY || "OUTROS").toUpperCase(),
        description: clean(rawJson.description || rawJson.DESCRIPTION || "Uma peça que redefine o conceito de elegância com acabamento artesanal de alto luxo.")
      });
    } catch (err) {
      console.error("Erro no processamento da joia:", err);
      return NextResponse.json({
        name: "Peça Magnética de Luxo",
        category: "ACESSÓRIOS",
        description: "Design contemporâneo com banho nobre, ideal para momentos que exigem brilho e sofisticação incomparável."
      });
    }

  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "FALHA_MOTOR_IA", details: message }, { status: 500 });
  }
}


