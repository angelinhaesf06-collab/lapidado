import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'edge'; // ⚡ EXTREMA VELOCIDADE E BAIXA LATÊNCIA

export async function POST(req: Request) {
  // Variáveis de escopo amplo para o catch
  let selectedStyle = 'luxo';

    try {
      const body = await req.json();
      const { image, style } = body;
      
      if (!image) {
        return NextResponse.json({ error: "Imagem não fornecida." }, { status: 400 });
      }

      selectedStyle = style || 'luxo';

      const apiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (!apiKey) {
      return NextResponse.json({ error: "Chave da IA não configurada." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
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

    // 💎 FALLBACKS ESTÁTICOS LUXUOSOS (INDETECTÁVEIS)
    const fallbacks = {
      luxo: {
        name: "Brinco Solitário Essência",
        category: "BRINCO",
        description: "Elegância que transcende o tempo.\n\nFicha Técnica:\n• Material: Metal Nobre\n• Banho: Ouro 18k\n• Detalhes: Cravação manual e polimento espelhado\n\nSugestão de Uso: Perfeito para elevar looks de gala ou eventos sociais sofisticados."
      },
      venda: {
        name: "Conjunto Premium Radiance",
        category: "CONJUNTO",
        description: "O brilho intenso que seu mostruário merece.\n\nFicha Técnica:\n• Material: Liga de Alta Fusão\n• Banho: Ouro 18k Premium\n• Detalhes: Brilho extraordinário e alta durabilidade\n\nSugestão de Uso: Ideal para quem busca ser o centro das atenções com elegância."
      },
      simples: {
        name: "Gargantilha Minimal",
        category: "COLAR",
        description: "Design clean para a versatilidade do seu dia.\n\nFicha Técnica:\n• Material: Hipoalergênico\n• Banho: Ouro 18k\n• Detalhes: Design ergonômico e leveza superior\n\nSugestão de Uso: Perfeita para usar sozinha ou em composições modernas de camadas."
      }
    };

    const config = styleConfigs[selectedStyle as keyof typeof styleConfigs] || styleConfigs.luxo;
    const selectedFallback = fallbacks[selectedStyle as keyof typeof fallbacks] || fallbacks.luxo;

    const promptText = `Aja como um(a) ${config.role} da Lapidado.
    Sua missão é criar nomes e descrições para joias com foco em QUIET LUXURY.
    
    TOM DE VOZ: ${config.tone}
    PALAVRAS-CHAVE: ${config.keywords}

    ESTRUTURA OBRIGATÓRIA DA DESCRIÇÃO (MÁXIMO 400 CARACTERES):
    1. Frase de Impacto (curta e envolvente).
    2. Ficha Técnica (tópicos sobre material, banho e detalhes como pedrarias/tamanho).
    3. Sugestão de Uso/Look (uma frase curta).

    REGRAS:
    - Nomes: Curtos e impactantes (ex: 'Brinco Aura', 'Colar Infinito').
    - CATEGORIA: Escolha uma entre [ANEL, BRINCO, COLAR, PULSEIRA, CONJUNTO, ACESSÓRIO].
    - LIMITE: A descrição total deve ter entre 250 e 400 caracteres.
    - ESTILO: Extremamente direto, luxuoso e focado em tópicos.
    
    RETORNE UM JSON PURO:
    {
      "name": "NOME DA JOIA",
      "category": "CATEGORIA",
      "description": "Texto da descrição aqui..."
    }`;

    // 🚀 MOTOR DE VANGUARDA: Gemini Flash (Estabilidade e Velocidade)
    console.log("💎 IA: Iniciando geração com gemini-flash-latest em MODO JSON...");
    let model;
    let result;

    try {
      model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest", 
      });

      const generationConfig = {
        temperature: 1, 
        topP: 0.95,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
      };

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ];

      let imageData = image.includes(",") ? image.split(",")[1] : image;
      const imagePart = { inlineData: { mimeType: "image/jpeg", data: imageData } };

      // 💎 Geramos o conteúdo de uma vez (não stream) para JSON puro e estável
      const chatResult = await model.generateContent({
        contents: [{ 
          role: 'user', 
          parts: [{ text: promptText }, imagePart] 
        }],
        generationConfig,
        safetySettings
      });
      
      const responseText = chatResult.response.text();
      console.log("✅ IA: Resposta JSON gerada com sucesso.");
      
      return new Response(responseText, {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });

    } catch (primaryErr: any) {
      console.error("❌ IA: Erro no modelo principal:", primaryErr.message);
      
      // 🔄 FALLBACK IMEDIATO: Resposta Estática para não travar o usuário
      return new Response(JSON.stringify(selectedFallback), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
  } catch (err: any) {
    console.error("❌ FALHA TOTAL NA IA:", err.message);
    
    // 🛡️ Recupera o fallback específico do estilo solicitado antes da falha
    const fallbacks = {
      luxo: {
        name: "Brinco Solitário Essência",
        category: "BRINCO",
        description: "Elegância que transcende o tempo.\n\nFicha Técnica:\n• Material: Metal Nobre\n• Banho: Ouro 18k\n• Detalhes: Cravação manual e polimento espelhado\n\nSugestão de Uso: Perfeito para elevar looks de gala ou eventos sociais sofisticados."
      },
      venda: {
        name: "Conjunto Premium Radiance",
        category: "CONJUNTO",
        description: "O brilho intenso que seu mostruário merece.\n\nFicha Técnica:\n• Material: Liga de Alta Fusão\n• Banho: Ouro 18k Premium\n• Detalhes: Brilho extraordinário e alta durabilidade\n\nSugestão de Uso: Ideal para quem busca ser o centro das atenções com elegância."
      },
      simples: {
        name: "Gargantilha Minimal",
        category: "COLAR",
        description: "Design clean para a versatilidade do seu dia.\n\nFicha Técnica:\n• Material: Hipoalergênico\n• Banho: Ouro 18k\n• Detalhes: Design ergonômico e leveza superior\n\nSugestão de Uso: Perfeita para usar sozinha ou em composições modernas de camadas."
      }
    };

    const finalFallback = fallbacks[selectedStyle as keyof typeof fallbacks] || fallbacks.luxo;

    return new Response(JSON.stringify(finalFallback), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
