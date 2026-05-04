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
    
    // 💎 PROMPTS ESPECIALIZADOS E IDENTIDADES DISTINTAS (Foco em Quiet Luxury)
    const styleConfigs = {
      luxo: {
        role: "Mestre joalheira e copywriter de alto luxo (estilo Quiet Luxury).",
        tone: "Sofisticado, minimalista e magnético. Enfatize a qualidade do banho (ouro/ródio) e o detalhamento das pedras sem usar clichês.",
        keywords: "Curadoria, design atemporal, banho nobre, acabamento impecável, elegância silenciosa."
      },
      venda: {
        role: "Especialista em marketing de semijoias premium.",
        tone: "Persuasivo e desejável. Foque no brilho, na versatilidade para looks e no valor agregado da peça.",
        keywords: "Tendência premium, brilho intenso, peça-chave, folheado de alta qualidade."
      },
      simples: {
        role: "Assistente técnico de catálogo de semijoias.",
        tone: "Direto e objetivo. Descrição técnica clara do banho e formato.",
        keywords: "Versátil, dia a dia, durabilidade, design clean."
      }
    };

    const config = styleConfigs[selectedStyle as keyof typeof styleConfigs];

    // 💎 INSTANCIAR IA
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Extração robusta de MimeType e Base64
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

    const modelParams = {
      systemInstruction: `Você é um(a) ${config.role}
      Sua missão é criar nomes e descrições para joias com foco em QUIET LUXURY.
      
      TOM DE VOZ: ${config.tone}
      PALAVRAS-CHAVE: ${config.keywords}

      REGRAS:
      - Nomes: Curtos e impactantes (ex: 'Brinco Aura', 'Colar Infinito').
      - Detalhes Técnicos: Observe se a peça é dourada (Ouro) ou prateada (Ródio) e cite o brilho das pedras/zircônias.
      - Texto: Máximo 3 frases curtas e envolventes.
      - Não use placeholders como [Nome da Joia].

      JSON OUTPUT:
      {"name": "NOME", "category": "CATEGORIA", "description": "CONTEÚDO NO ESTILO ${selectedStyle.toUpperCase()}"}`
    };

    let result;
    const generationConfig = {
      temperature: 0.7, // 🚀 Reduzido para maior precisão e menos alucinação
      topP: 0.9,
      maxOutputTokens: 500, // 🚀 Reduzido para economia de tokens e rapidez
      responseMimeType: "application/json",
    };

    // Objeto de imagem com resolução otimizada
    const imagePart = {
      inlineData: { 
        mimeType: finalMime, 
        data: dataOnly,
      }
    };

    try {
      // 🚀 AGORA O GEMINI 3.1 FLASH LITE É O PRINCIPAL (Ultra eficiência e velocidade)
      console.log("Tentando Gemini 3.1 Flash Lite...");
      const modelFlash = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
      result = await tryGenerate(modelFlash, {
        contents: [
          { 
            role: 'user', 
            parts: [
              { text: modelParams.systemInstruction },
              imagePart
            ] 
          }
        ],
        generationConfig,
        safetySettings
      });
    } catch (e: any) {
      console.error("Gemini 3.1 Flash Lite falhou:", e.message);
      console.log("Tentando Gemini 2.5 Flash como backup...");
      try {
        const model25 = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        result = await tryGenerate(model25, {
          contents: [
            { 
              role: 'user', 
              parts: [
                { text: modelParams.systemInstruction },
                imagePart
              ] 
            }
          ],
          generationConfig,
          safetySettings
        });
      } catch (e2: any) {
        console.error("Gemini 2.5 Flash falhou:", e2.message);
        console.log("Tentando Gemini 2.0 Flash como backup...");
        try {
          const model20 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          result = await tryGenerate(model20, {
            contents: [
              { 
                role: 'user', 
                parts: [
                  { text: modelParams.systemInstruction },
                  { inlineData: { mimeType: finalMime, data: dataOnly } }
                ] 
              }
            ],
            generationConfig,
            safetySettings
          });
        } catch (e3: any) {
          console.error("Gemini 2.0 Flash falhou:", e3.message);
          console.log("Tentando Gemini Flash Latest como última instância...");
          const modelLatest = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
          result = await tryGenerate(modelLatest, {
            contents: [
              { 
                role: 'user', 
                parts: [
                  { text: modelParams.systemInstruction },
                  { inlineData: { mimeType: finalMime, data: dataOnly } }
                ] 
              }
            ],
            generationConfig,
            safetySettings
          });
        }
      }
    }

    const response = await result.response;
    let aiText = response.text().trim();
    
    // Limpeza agressiva de Markdown
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
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
    } catch (e: any) {
      console.error("Erro no processamento da joia:", e);
      return NextResponse.json({
        name: "JOIA LAPIDADA",
        category: "OUTROS",
        description: "PEÇA EXCLUSIVA COM BANHO DE ALTA QUALIDADE E DESIGN REFINADO."
      });
    }

  } catch (error: any) {
    console.error("ERRO CRÍTICO IA:", error.message);
    return NextResponse.json({ error: "FALHA_MOTOR_IA", details: error.message }, { status: 500 });
  }
}
