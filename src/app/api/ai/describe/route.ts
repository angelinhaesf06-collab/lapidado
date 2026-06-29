import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'edge'; // ⚡ EXTREMA VELOCIDADE E BAIXA LATÊNCIA

// 💎 Ângulos de venda CURTOS por tipo de joia (poucos tokens, descrição mais certeira)
const CATEGORY_ANGLES: Record<string, string> = {
  anel: "valorize o gesto das mãos; ótimo para presente e datas",
  alianca: "símbolo de união; elegância para o dia a dia",
  brinco: "ilumine e valorize o rosto; do casual à festa",
  colar: "destaque o decote; ponto focal do look",
  gargantilha: "realce o pescoço e o decote",
  pulseira: "delicadeza no pulso; linda sozinha ou em mix",
  bracelete: "presença marcante no pulso",
  conjunto: "look pronto e harmônico; praticidade e impacto",
  tornozeleira: "charme leve para os pés",
  piercing: "estilo e personalidade em alta",
  pingente: "detalhe que conta uma história",
};

function angleFor(category?: string): string {
  if (!category) return "";
  const c = category.toLowerCase();
  for (const key in CATEGORY_ANGLES) {
    if (c.includes(key)) return CATEGORY_ANGLES[key];
  }
  return "";
}

const STYLE_TONE: Record<string, string> = {
  luxo: "Sofisticado e poético; enfatize brilho e exclusividade.",
  venda: "Persuasivo e desejável; use gatilhos de desejo.",
  simples: "Direto e objetivo; foque em versatilidade e durabilidade.",
};

// 💎 Textos de reserva (caso a IA fique indisponível) — por estilo
const FALLBACKS: Record<string, { name: string; category: string; description: string }> = {
  luxo: {
    name: "Brinco Solitário Essência",
    category: "BRINCO",
    description: "Elegância que transcende o tempo.\n\nFicha Técnica:\n• Material: Metal Nobre\n• Banho: Ouro 18k\n• Detalhes: Cravação manual e polimento espelhado\n\nSugestão de Uso: Perfeito para elevar looks de gala ou eventos sociais sofisticados.",
  },
  venda: {
    name: "Conjunto Premium Radiance",
    category: "CONJUNTO",
    description: "O brilho intenso que seu mostruário merece.\n\nFicha Técnica:\n• Material: Liga de Alta Fusão\n• Banho: Ouro 18k Premium\n• Detalhes: Brilho extraordinário e alta durabilidade\n\nSugestão de Uso: Ideal para quem busca ser o centro das atenções com elegância.",
  },
  simples: {
    name: "Gargantilha Minimal",
    category: "COLAR",
    description: "Design clean para a versatilidade do seu dia.\n\nFicha Técnica:\n• Material: Hipoalergênico\n• Banho: Ouro 18k\n• Detalhes: Design ergonômico e leveza superior\n\nSugestão de Uso: Perfeita para usar sozinha ou em composições modernas de camadas.",
  },
};

export async function POST(req: Request) {
  let style = "luxo";
  let category = "";

  try {
    const body = await req.json();
    const { image } = body;
    style = body.style || "luxo";
    category = (body.category || "").trim();

    if (!image) {
      return NextResponse.json({ error: "Imagem não fornecida." }, { status: 400 });
    }

    // 🔒 SEGURANÇA: a chave da IA fica SOMENTE no servidor (nunca NEXT_PUBLIC, que vazaria no navegador)
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Chave da IA não configurada." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const tone = STYLE_TONE[style] || STYLE_TONE.luxo;
    const angle = angleFor(category);

    // Se a lojista já escolheu a categoria, a IA NÃO precisa adivinhar (economiza tokens) e ganha um ângulo específico
    const categoryRule = category
      ? `CATEGORIA (já definida): ${category.toUpperCase()}${angle ? ` — ${angle}` : ""}. Use exatamente essa categoria.`
      : `CATEGORIA: escolha uma entre [ANEL, BRINCO, COLAR, PULSEIRA, CONJUNTO, ACESSÓRIO].`;

    // ✨ Prompt enxuto (menos tokens de entrada) e focado
    const promptText = `Você é copywriter de semijoias da Lapidado. Tom: ${tone}
${categoryRule}
Baseie-se na foto e escreva em PT-BR.
DESCRIÇÃO (máx. 300 caracteres): 1) frase de impacto curta; 2) ficha técnica em tópicos (material, banho, detalhes); 3) sugestão de uso em 1 frase.
NOME: curto e marcante (ex: "Brinco Aura").
Responda APENAS com JSON: {"name":"","category":"","description":""}`;

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      maxOutputTokens: 200, // ⚡ resposta enxuta = menos custo
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

    // 🔁 Tenta o modelo principal e, se falhar (ex: nome de modelo inválido), um modelo de reserva
    //    REAL antes de cair no texto fixo — assim a lojista recebe uma descrição de verdade.
    const MODELS = ["gemini-3.1-flash-lite", "gemini-2.0-flash"];
    let responseText = "";
    let lastErr: unknown = null;

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: promptText }, imagePart] }],
          generationConfig,
          safetySettings,
        });
        responseText = result.response.text();
        if (responseText) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!responseText) throw lastErr || new Error("Sem resposta da IA");

    // Limpeza caso o modelo devolva blocos markdown
    if (responseText.includes("```json")) {
      responseText = responseText.split("```json")[1].split("```")[0];
    } else if (responseText.includes("```")) {
      responseText = responseText.split("```")[1].split("```")[0];
    }
    responseText = responseText.trim();

    // 💎 Garante que a categoria definida pela lojista seja respeitada na resposta
    if (category) {
      try {
        const obj = JSON.parse(responseText);
        obj.category = category.toUpperCase();
        responseText = JSON.stringify(obj);
      } catch {
        /* mantém o texto original se não for JSON válido */
      }
    }

    return new Response(responseText, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    console.error("❌ IA falhou:", (err as Error)?.message);

    // 🛡️ Reserva: texto pronto do estilo pedido (e respeitando a categoria escolhida, se houver)
    const base = FALLBACKS[style] || FALLBACKS.luxo;
    const finalFallback = category ? { ...base, category: category.toUpperCase() } : base;

    return new Response(JSON.stringify(finalFallback), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
