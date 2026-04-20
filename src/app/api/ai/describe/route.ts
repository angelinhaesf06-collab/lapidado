import { NextResponse } from "next/server";

// 🚀 MOTOR ESTABILIZADO: Usando Node.js Runtime para garantir injeção de chaves
export const runtime = 'nodejs';

// 💎 NEXUS: MOTOR DE IA LAPIDADO (Versão Otimizada para Performance)
export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // 💎 NEXUS: BUSCA EXAUSTIVA POR CREDENCIAIS (Resiliência Vercel)
    const apiKey = 
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
      process.env.GEMINI_API_KEY || 
      process.env.gemini_api_key ||
      process.env.NEXT_PUBLIC_GEMINI_KEY;

    if (!apiKey || apiKey.length < 10) {
      console.error("❌ ERRO CRÍTICO: Nenhuma variação de GEMINI_API_KEY encontrada no ambiente Vercel.");
      return NextResponse.json({ 
        error: "CONFIGURAÇÃO: Chave de IA não encontrada no servidor.",
        details: "Certifique-se de que a variável NEXT_PUBLIC_GEMINI_API_KEY está configurada para ALL ENVIRONMENTS na Vercel e faça um REDEPLOY."
      }, { status: 401 });
    }

    const base64Data = image.split(",")[1] || image;
    
    // 💎 NEXUS: Usando o modelo flash-latest para garantir a versão mais estável e rápida disponível
    const modelName = "gemini-flash-latest";
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    console.log(`💎 NEXUS: Acionando motor ${modelName}...`);
    
    const url = `${baseUrl}/models/${modelName}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Você é um Copywriter Especialista em Vendas de Semijoias para o 'Catálogo Lapidado'. Analise a imagem e retorne um objeto JSON com: 1. 'name': Nome comercial curto (MÁX. 30 caracteres, EM MAIÚSCULAS). 2. 'category': Categoria (Anéis, Colares, Brincos ou Pulseiras). 3. 'description': Copy IMPACTANTE em MÁXIMO 3 FRASES CURTAS (MÁX. 120 caracteres total). 4. 'material': Banho identificado (Ouro 18k, Prata 925 ou Ródio). Retorne APENAS o JSON puro, sem markdown." },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.4
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();

    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log(`✅ SUCESSO: Motor ${modelName} respondeu.`);
      let text = data.candidates[0].content.parts[0].text;
      
      // Limpeza de Markdown (caso a IA retorne ```json ... ```)
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const finalJson = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      return NextResponse.json(finalJson);
    }

    // Erro detalhado da API do Google
    const errorBody = data.error || {};
    const errorMessage = errorBody.message || "Erro desconhecido na API do Google";
    const errorCode = errorBody.code || response.status;
    
    console.error(`❌ FALHA NO MOTOR ${modelName}: [${errorCode}] ${errorMessage}`);
    
    return NextResponse.json({ 
      error: "O MOTOR DE IA REJEITOU A FOTO.", 
      details: errorMessage,
      code: errorCode
    }, { status: 400 });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("ERRO OPERACIONAL IA:", err.message);
    return NextResponse.json({ 
      error: "IA EM MANUTENÇÃO.", 
      details: err.message 
    }, { status: 503 });
  }
}
