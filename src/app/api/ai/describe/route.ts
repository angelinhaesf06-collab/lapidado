import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const runtime = 'nodejs';
export const maxDuration = 30;

async function tryGenerate(model: any, content: any) {
  let retries = 1; // 🚀 Reduzido para 1 tentativa para não travar a tela
  let delay = 1000;
  
  while (retries >= 0) {
    try {
      return await model.generateContent(content);
    } catch (err: any) {
      if ((err.message.includes("503") || err.message.includes("Service Unavailable")) && retries > 0) {
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
    const { image, style } = payload;
    if (!image) return NextResponse.json({ error: "DADOS_AUSENTES" }, { status: 400 });

    const selectedStyle = style || 'luxo';
    
    // 💎 PROMPTS ESPECIALIZADOS E IDENTIDADES DISTINTAS
    const styleConfigs = {
      luxo: {
        role: "Mestre joalheira e copywriter de alto luxo.",
        tone: "Poético, sofisticado, magnético e exclusivo. Use adjetivos como 'sublime', 'celestial' e 'atemporal'.",
        keywords: "Curadoria, sofisticação, DNA da marca, brilho eterno."
      },
      venda: {
        role: "Especialista em marketing de joias e gatilhos de vendas.",
        tone: "Persuasivo, energético e focado em desejo imediato. Use termos que estimulem a compra agora.",
        keywords: "Tendência, look impecável, garanta a sua, peça-chave, transforme seu visual."
      },
      simples: {
        role: "Assistente técnico de catálogo de semijoias.",
        tone: "Direto, técnico, limpo e objetivo. Sem floreios ou adjetivos exagerados.",
        keywords: "Versátil, dia a dia, alta durabilidade, acabamento polido, design clean."
      }
    };

    const config = styleConfigs[selectedStyle as keyof typeof styleConfigs];

    const modelParams = {
      systemInstruction: `Você é um(a) ${config.role}
      Sua missão é criar nomes e descrições para joias.
      
      TOM DE VOZ: ${config.tone}
      PALAVRAS-CHAVE: ${config.keywords}

      REGRAS:
      - NUNCA repita descrições.
      - Nomes curtos e impactantes.
      - Para peças douradas: ${selectedStyle === 'luxo' ? '"Banho Nobre", "Brilho Solar"' : '"Folheado a Ouro", "Acabamento Dourado"'}
      - Descrição: Máximo 3 frases curtas.

      JSON OUTPUT:
      {"name": "NOME", "category": "CATEGORIA", "description": "CONTEÚDO NO ESTILO ${selectedStyle.toUpperCase()}"}`
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
