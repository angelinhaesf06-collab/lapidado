import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { image, style } = await req.json();
    const apiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (!apiKey) {
      console.error("❌ ERRO: GEMINI_API_KEY NÃO ENCONTRADA.");
      return NextResponse.json({ error: "Chave da IA não configurada." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
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

    const selectedStyle = style || 'luxo';
    const config = styleConfigs[selectedStyle as keyof typeof styleConfigs] || styleConfigs.luxo;

    const systemText = `Você é um(a) ${config.role} da Lapidado.
    Sua missão é criar nomes e descrições para joias com foco em QUIET LUXURY.
    
    TOM DE VOZ: ${config.tone}
    PALAVRAS-CHAVE: ${config.keywords}

    ESTRUTURA DA DESCRIÇÃO:
    1. Um parágrafo curto (máximo 2 frases) de introdução emocional e envolvente.
    2. Detalhes técnicos em Bullet Points (cite o banho nobre, acabamento e pedrarias se houver).
    3. Uma sugestão de "Como usar".

    REGRAS:
    - Nomes: Curtos e impactantes (ex: 'Brinco Aura', 'Colar Infinito').
    - Proibido termos genéricos. Foque na valorização da peça.
    - CATEGORIA: Escolha uma entre [ANEL, BRINCO, COLAR, PULSEIRA, CONJUNTO, ACESSÓRIO].
    - JSON OUTPUT: {"name": "NOME", "category": "CATEGORIA", "description": "CONTEÚDO NO ESTILO ${selectedStyle.toUpperCase()}"}`;

    const generationConfig = {
      temperature: 0.7, 
      topP: 0.9,
      maxOutputTokens: 400,
      responseMimeType: "application/json",
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const imageData = image.includes(",") ? image.split(",")[1] : image;
    const imagePart = { inlineData: { mimeType: "image/jpeg", data: imageData } };

    let result;
    try {
      // 🚀 MOTOR 1: Tentar o modelo solicitado (3.1 Flash Lite)
      console.log("Tentando Gemini 3.1 Flash Lite...");
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.1-flash-lite-preview",
        systemInstruction: { role: 'system', parts: [{ text: systemText }] }
      });
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [imagePart] }],
        generationConfig,
        safetySettings
      });
    } catch (e1: any) {
      console.warn("⚠️ Gemini 3.1 falhou, tentando 1.5 Flash (Estável)...", e1.message);
      try {
        // 🚀 MOTOR 2: Modelo Estável 1.5 Flash
        const modelStable = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          systemInstruction: { role: 'system', parts: [{ text: systemText }] }
        });
        result = await modelStable.generateContent({
          contents: [{ role: 'user', parts: [imagePart] }],
          generationConfig,
          safetySettings
        });
      } catch (e2: any) {
        console.error("❌ ERRO CRÍTICO NA IA:", e2.message);
        throw e2;
      }
    }

    const response = await result.response;
    let aiText = response.text().trim();
    
    // Limpeza de Markdown
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) aiText = jsonMatch[0];

    return NextResponse.json(JSON.parse(aiText));

  } catch (err: any) {
    console.error("ERRO FINAL NA ROTA IA:", err.message);
    return NextResponse.json({ 
      error: "Falha ao processar imagem.",
      details: err.message 
    }, { status: 500 });
  }
}
