import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export const runtime = 'nodejs'
export const maxDuration = 30 

export async function POST(req: Request) {
  try {
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim()

    if (!geminiKey) {
      return NextResponse.json({ error: "ERRO_CONFIG", details: "Chave API ausente." }, { status: 401 })
    }

    const payload = await req.json()
    const { image } = payload
    if (!image) return NextResponse.json({ error: "DADOS_AUSENTES" }, { status: 400 })

    // 🔄 MOTOR FINAL: gemini-1.5-flash (sem prefixos manuais)
    const genAI = new GoogleGenerativeAI(geminiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const mimeMatch = image.match(/data:(.*?);base64/)
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg"
    const base64Data = image.includes(",") ? image.split(",")[1] : image
    
    const prompt = "Analyze the jewellery. Return ONLY JSON: {\"name\": \"...\", \"category\": \"...\", \"description\": \"...\", \"material\": \"...\"}"

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64Data } }
    ])

    const response = await result.response
    const aiText = response.text().trim()
    
    const start = aiText.indexOf('{')
    const end = aiText.lastIndexOf('}')
    if (start === -1) throw new Error("IA_JSON_INVALIDO")
    
    const finalJson = aiText.substring(start, end + 1)
    return NextResponse.json(JSON.parse(finalJson))

  } catch (error: any) {
    console.error("ERRO IA:", error.message)
    return NextResponse.json({ 
      error: "ERRO_MOTOR_FINAL", 
      details: error.message 
    }, { status: 500 })
  }
}
