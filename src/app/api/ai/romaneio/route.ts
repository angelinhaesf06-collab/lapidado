import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export const runtime = 'nodejs'
export const maxDuration = 45 // Segundos (PDFs demoram mais)
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  console.log("💎 [DIAGNOSTICO ROMANEIO] Iniciando processamento...");
  
  try {
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim()

    if (!geminiKey) {
      console.error("❌ [ERRO ROMANEIO] Chave API não configurada.");
      return NextResponse.json({ error: "FALHA_CONFIGURACAO", details: "Chave API ausente." }, { status: 401 })
    }

    const payload = await req.json()
    const { image } = payload

    if (!image) {
      return NextResponse.json({ error: "ERRO_IA_ROMANEIO", details: "Arquivo não fornecido." }, { status: 400 })
    }

    console.log("💎 [DIAGNOSTICO ROMANEIO] Arquivo recebido. Tamanho:", Math.round(image.length / 1024), "KB");

    const genAI = new GoogleGenerativeAI(geminiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { 
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    })

    const mimeMatch = image.match(/data:(.*?);base64/)
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg"
    const base64Data = image.includes(",") ? image.split(",")[1] : image

    console.log("💎 [DIAGNOSTICO ROMANEIO] Chamando Gemini para ler", mimeType, "...");

    const prompt = `
      Você é um assistente especialista em joalheria da marca LAPIDADO. 
      Analise o arquivo anexo (foto ou PDF) deste romaneio e extraia os itens.
      Retorne APENAS o array JSON: [{"name": "ITEM", "quantity": 1, "unitCost": 0.00}]
    `

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ])

    const response = await result.response
    const text = response.text().trim()
    
    console.log("💎 [DIAGNOSTICO ROMANEIO] Resposta da IA recebida.");

    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    
    if (start === -1 || end === -1) {
      console.error("❌ [ERRO ROMANEIO] IA não retornou lista válida. Resposta:", text);
      throw new Error("A IA não conseguiu ler os dados do arquivo.");
    }

    const jsonStr = text.substring(start, end + 1)
    console.log("✅ [DIAGNOSTICO ROMANEIO] Sucesso!");
    
    return NextResponse.json(JSON.parse(jsonStr))

  } catch (error: any) {
    console.error("❌ [ERRO ROMANEIO]:", error.message);
    return NextResponse.json({ 
      error: "ERRO_IA_ROMANEIO", 
      details: error.message || "Falha ao processar o arquivo" 
    }, { status: 500 })
  }
}
