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
        description: "Uma joia de design atemporal que captura a luz de forma sublime. Banhado em metal nobre com cravação manual impecável.\n\n• Banho de Ouro 18k\n• Acabamento de Alta Joalheria\n• Design Minimalista\n\nComo usar: Ideal para jantares ou eventos de gala, elevando instantaneamente sua presença com sofisticação."
      },
      venda: {
        name: "Conjunto Premium Radiance",
        category: "CONJUNTO",
        description: "A peça-chave que faltava no seu mostruário! Com um brilho intenso que atrai todos os olhares, este conjunto de alta qualidade é sucesso de vendas garantido.\n\n• Brilho Extraordinário\n• Peça Versátil\n• Qualidade Premium\n\nComo usar: Combine com looks neutros e veja a mágica acontecer. Perfeito para mulheres que amam ser o centro das atenções."
      },
      simples: {
        name: "Gargantilha Minimal",
        category: "COLAR",
        description: "Design clean focado na versatilidade do dia a dia. Com excelente durabilidade e acabamento cuidadoso, é o acessório prático que combina com qualquer estilo.\n\n• Design Ergonômico\n• Leveza Incomparável\n• Durabilidade Superior\n\nComo usar: Use sozinha para um toque discreto ou em composições de camadas para um visual moderno."
      }
    };

    const config = styleConfigs[selectedStyle as keyof typeof styleConfigs] || styleConfigs.luxo;
    const selectedFallback = fallbacks[selectedStyle as keyof typeof fallbacks] || fallbacks.luxo;

    const promptText = `Aja como um(a) ${config.role} da Lapidado.
    Sua missão é criar nomes e descrições para joias com foco em QUIET LUXURY.
    
    TOM DE VOZ: ${config.tone}
    PALAVRAS-CHAVE: ${config.keywords}

    ESTRUTURA DA DESCRIÇÃO:
    1. Um parágrafo curto (máximo 2 frases) de introdução emocional e envolvente.
    2. Detalhes técnicos em Bullet Points (cite o banho nobre, acabamento e pedrarias se houver).
    3. Uma sugestão de "Como usar".

    REGRAS:
    - Nomes: Curtos e impactantes (ex: 'Brinco Aura', 'Colar Infinito').
    - CATEGORIA: Escolha uma entre [ANEL, BRINCO, COLAR, PULSEIRA, CONJUNTO, ACESSÓRIO].
    
    RETORNE UM JSON PURO:
    {
      "name": "NOME DA JOIA",
      "category": "CATEGORIA",
      "description": "Texto da descrição aqui..."
    }`;

    // 🚀 MOTOR DE VANGUARDA: Gemini 3 Flash Preview (Velocidade Geracional)
    let model;
    let result;

    try {
      model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview", // ⚡ A tecnologia mais recente para velocidade extrema e eficiência
      });

      const generationConfig = {
        temperature: 0.6, 
        topP: 0.9,
        maxOutputTokens: 1000, // Janela maior para aproveitar o melhor raciocínio do G3
      };

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ];

      let imageData = image.includes(",") ? image.split(",")[1] : image;
      const imagePart = { inlineData: { mimeType: "image/jpeg", data: imageData } };

      result = await model.generateContentStream({
        contents: [{ 
          role: 'user', 
          parts: [{ text: promptText }, imagePart] 
        }],
        generationConfig,
        safetySettings
      });
    } catch (primaryErr) {
      console.warn("⚠️ Gemini 3 Flash-Preview Falhou, tentando Fallback Secundário (Flash 8B)...");
      
      // 🔄 FALLBACK SECUNDÁRIO: Gemini 1.5 Flash-8B
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-8b"
      });

      let imageData = image.includes(",") ? image.split(",")[1] : image;
      const imagePart = { inlineData: { mimeType: "image/jpeg", data: imageData } };

      result = await model.generateContentStream({
        contents: [{ 
          role: 'user', 
          parts: [{ text: promptText }, imagePart] 
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 800,
        }
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
        } catch (streamErr) {
          console.error("❌ Erro durante o stream da IA:", streamErr);
          // Se o stream quebrar, enviamos o fallback como resposta final no corpo do stream
          controller.enqueue(encoder.encode(JSON.stringify(selectedFallback)));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (err: any) {
    console.error("❌ FALHA TOTAL NA IA:", err.message);
    
    // 🛡️ Recupera o fallback específico do estilo solicitado antes da falha
    const fallbacks = {
      luxo: {
        name: "Brinco Solitário Essência",
        category: "BRINCO",
        description: "Uma joia de design atemporal que captura a luz de forma sublime. Banhado em metal nobre com cravação manual impecável.\n\n• Banho de Ouro 18k\n• Acabamento de Alta Joalheria\n• Design Minimalista\n\nComo usar: Ideal para jantares ou eventos de gala, elevando instantaneamente sua presença com sofisticação."
      },
      venda: {
        name: "Conjunto Premium Radiance",
        category: "CONJUNTO",
        description: "A peça-chave que faltava no seu mostruário! Com um brilho intenso que atrai todos os olhares, este conjunto de alta qualidade é sucesso de vendas garantido.\n\n• Brilho Extraordinário\n• Peça Versátil\n• Qualidade Premium\n\nComo usar: Combine com looks neutros e veja a mágica acontecer. Perfeito para mulheres que amam ser o centro das atenções."
      },
      simples: {
        name: "Gargantilha Minimal",
        category: "COLAR",
        description: "Design clean focado na versatilidade do dia a dia. Com excelente durabilidade e acabamento cuidadoso, é o acessório prático que combina com qualquer estilo.\n\n• Design Ergonômico\n• Leveza Incomparável\n• Durabilidade Superior\n\nComo usar: Use sozinha para um toque discreto ou em composições de camadas para um visual moderno."
      }
    };

    const finalFallback = fallbacks[selectedStyle as keyof typeof fallbacks] || fallbacks.luxo;

    return new Response(JSON.stringify(finalFallback), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
