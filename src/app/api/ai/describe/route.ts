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
      // 🚀 1ª OPÇÃO: Gemini 2.5 Flash
      const model25 = genAI.getGenerativeModel({ ...modelParams, model: "gemini-2.5-flash" });
      result = await tryGenerate(model25, {
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig,
        safetySettings
      });
    } catch (e) {
      console.error("Gemini 2.5 Flash falhou, tentando Pro...");
      // 🚀 2ª OPÇÃO: Gemini 2.5 Pro
      const model25pro = genAI.getGenerativeModel({ ...modelParams, model: "gemini-2.5-pro" });
      result = await tryGenerate(model25pro, {
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }] }],
        generationConfig,
        safetySettings
      });
    }

    const response = await result.response;
    let aiText = response.text().trim();
    
    // 💎 NEXUS: Limpeza Ultra-Resiliente para evitar a palavra "json"
    aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').replace(/JSON/gi, '').replace(/Aqui está o/gi, '').trim();
    
    // Se a resposta começar com texto antes do { tenta pegar só o que está entre { }
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) aiText = jsonMatch[0];

    try {
      const rawJson = JSON.parse(aiText);
      // 💎 NEXUS: Normalização para letras maiúsculas e sem resíduos
      return NextResponse.json({
        name: (rawJson.name || rawJson.NAME || rawJson.Nome || "JOIA LAPIDADA").toUpperCase().replace('JSON', '').trim(),
        category: (rawJson.category || rawJson.CATEGORY || rawJson.Categoria || "OUTROS").toUpperCase().replace('JSON', '').trim(),
        description: (rawJson.description || rawJson.DESCRIPTION || rawJson.Descrição || "").toUpperCase().replace('JSON', '').trim()
      });
    } catch (e) {
      console.error("Erro crítico no JSON:", e, "Texto bruto:", aiText);
      // Se ainda assim falhar, tenta extrair o que for possível do texto
      return NextResponse.json({
        name: "JOIA ANALISADA",
        category: "OUTROS",
        description: aiText.substring(0, 500).toUpperCase()
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "FALHA_MOTOR_IA", details: error.message }, { status: 500 });
  }
}
