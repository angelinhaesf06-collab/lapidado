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
      systemInstruction: `Você é uma especialista em alta joalheria e semijoias de luxo. 
      Sua tarefa é analisar a imagem e retornar um JSON detalhado.
      
      No campo "name": Crie um nome comercial luxuoso e atraente.
      No campo "category": Identifique se é ANEL, BRINCO, COLAR, PULSEIRA ou CONJUNTO.
      No campo "description": Escreva uma descrição profissional de 2 a 3 frases destacando:
      - O banho (ex: banhado a ouro 18k, ródio branco)
      - Detalhes das pedras (ex: zircônias, cristais, lapidação)
      - O design (ex: cravejado, polido, design orgânico)
      - Para qual ocasião a peça é ideal.

      RESPONDA APENAS O JSON: {"name": "...", "category": "...", "description": "..."}`
    };

    let result;
    const generationConfig = {
      temperature: 0.2,
      topP: 0.95,
      maxOutputTokens: 1000,
      responseMimeType: "application/json", // 🚀 FORÇA O MODO JSON NATIVO
    };

    try {
      // 🚀 MOTOR DE ELITE: gemini-pro-latest
      const modelPro = genAI.getGenerativeModel({ ...modelParams, model: "gemini-pro-latest" });
      result = await tryGenerate(modelPro, {
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: {
          ...generationConfig,
          temperature: 0.2,
        },
        safetySettings
      });
    } catch (e) {
      console.error("Falha no Pro, tentando Flash...");
      const modelFlash = genAI.getGenerativeModel({ ...modelParams, model: "gemini-flash-latest" });
      result = await tryGenerate(modelFlash, {
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig,
        safetySettings
      });
    }

    const response = await result.response;
    let aiText = response.text().trim();
    
    // 💎 LIMPEZA RADICAL NEXUS: Remove qualquer menção a markdown ou palavras técnicas
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiText = jsonMatch[0];
    }

    try {
      const rawJson = JSON.parse(aiText);
      
      // 💎 FILTRO DE PUREZA: Garante que NENHUMA palavra técnica vaze para o nome ou descrição
      const clean = (txt: string) => {
        if (!txt) return "";
        return txt.toString()
          .replace(/json/gi, "")
          .replace(/```/gi, "")
          .replace(/Aqui está/gi, "")
          .replace(/Joia Identificada/gi, "")
          .replace(/\[|\]/g, "")
          .trim()
          .toUpperCase();
      };

      return NextResponse.json({
        name: clean(rawJson.name || rawJson.NAME || "JOIA EXCLUSIVA"),
        category: clean(rawJson.category || rawJson.CATEGORY || "OUTROS"),
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
