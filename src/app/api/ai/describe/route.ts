import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, Content, GenerationConfig, SafetySetting } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 30;

async function tryGenerate(model: GenerativeModel, content: { contents: Content[], generationConfig: GenerationConfig, safetySettings: SafetySetting[] }) {
  let retries = 1; 
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
    if (!apiKey) {
      console.error("❌ ERRO: GEMINI_API_KEY NÃO ENCONTRADA NO AMBIENTE.");
      return NextResponse.json({ error: "ERRO_CONFIG", details: "API Key ausente" }, { status: 401 });
    }

    const payload = await req.json();
    const { image, style, mode } = payload;
    if (!image) return NextResponse.json({ error: "DADOS_AUSENTES" }, { status: 400 });

    const selectedStyle = style || mode?.toLowerCase() || 'luxo';
    
    // 💎 PROMPTS ESPECIALIZADOS (Quiet Luxury)
    const styleConfigs = {
      luxo: {
        role: "Mestre joalheira e copywriter de alto luxo.",
        tone: "Sofisticado e poético. Enfatize o brilho e a exclusividade.",
        keywords: "Design atemporal, banho nobre, acabamento impecável, elegância silenciosa."
      },
      venda: {
        role: "Especialista em marketing de semijoias.",
        tone: "Persuasivo e desejável. Use gatilhos mentais de desejo.",
        keywords: "Tendência premium, brilho intenso, peça-chave, folheado de alta qualidade."
      },
      simples: {
        role: "Assistente técnico de catálogo.",
        tone: "Direto e objetivo.",
        keywords: "Versátil, dia a dia, durabilidade, design clean."
      }
    };

    const config = styleConfigs[selectedStyle as keyof typeof styleConfigs] || styleConfigs.luxo;

    const genAI = new GoogleGenerativeAI(apiKey);
    
    let finalMime = "image/jpeg";
    let dataOnly = image;

    if (image.includes(";base64,")) {
      const parts = image.split(";base64,");
      finalMime = parts[0].replace("data:", "");
      dataOnly = parts[1];
    } else if (image.startsWith("data:")) {
      const parts = image.split(",");
      finalMime = parts[0].split(":")[1].split(";")[0];
      dataOnly = parts[1];
    }

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const systemInstruction = `Você é um(a) ${config.role} da Lapidado.
    Sua missão é criar nomes e descrições para joias com foco em QUIET LUXURY.
    
    TOM DE VOZ: ${config.tone}
    PALAVRAS-CHAVE: ${config.keywords}

    REGRAS:
    - Nomes: Curtos e impactantes (ex: 'Brinco Aura', 'Colar Infinito').
    - Detalhes Técnicos: Observe se a peça é dourada (Ouro) ou prateada (Ródio) e cite o brilho das pedras/zircônias.
    - Texto: Máximo 3 frases curtas e envolventes.
    - JSON OUTPUT: {"name": "NOME", "category": "CATEGORIA", "description": "CONTEÚDO NO ESTILO ${selectedStyle.toUpperCase()}"}`;

    const generationConfig = {
      temperature: 0.7, 
      topP: 0.9,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
    };

    const imagePart = {
      inlineData: { mimeType: finalMime, data: dataOnly }
    };

    let result;
    try {
      // 🚀 MOTOR 3.1 FLASH LITE: O motor mais moderno e eficiente (2026)
      console.log("Tentando Gemini 3.1 Flash Lite para Descrição...");
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
      result = await tryGenerate(model, {
        contents: [{ role: 'user', parts: [{ text: systemInstruction }, imagePart] }],
        generationConfig,
        safetySettings
      });
    } catch (e: any) {
      console.error("Gemini 3.1 Flash Lite falhou, tentando Flash Latest:", e.message);
      try {
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        result = await tryGenerate(modelFlash, {
          contents: [{ role: 'user', parts: [{ text: systemInstruction }, imagePart] }],
          generationConfig,
          safetySettings
        });
      } catch (e2: any) {
        console.error("Gemini Flash falhou, tentando backup Pro:", e2.message);
        const modelBackup = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        result = await tryGenerate(modelBackup, {
          contents: [{ role: 'user', parts: [{ text: systemInstruction }, imagePart] }],
          generationConfig,
          safetySettings
        });
      }
    }

    const response = await result.response;
    let aiText = response.text().trim();
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) aiText = jsonMatch[0];

    try {
      const rawJson = JSON.parse(aiText);
      const clean = (txt: string | undefined) => txt?.toString().replace(/json|```| Aqui está|\[|\]/gi, "").trim() || "";

      return NextResponse.json({
        name: clean(rawJson.name || rawJson.NAME || "Peça Nobre Lapidado"),
        category: clean(rawJson.category || rawJson.CATEGORY || "OUTROS").toUpperCase(),
        description: clean(rawJson.description || rawJson.DESCRIPTION || "Uma peça que redefine o conceito de elegância.")
      });
    } catch (e: any) {
      return NextResponse.json({
        name: "Peça Magnética de Luxo",
        category: "ACESSÓRIOS",
        description: "Design contemporâneo com banho nobre e brilho incomparável."
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "FALHA_MOTOR_IA", details: error.message }, { status: 500 });
  }
}
