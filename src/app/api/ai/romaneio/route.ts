import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")

export async function POST(req: Request) {
  try {
    const { image } = await req.json()
    if (!image) return NextResponse.json({ error: "Imagem não fornecida" }, { status: 400 })

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      Você é um assistente especialista em joalheria. 
      Analise a imagem deste romaneio de compra de fornecedor e extraia os itens em formato JSON.
      Procure por: Nome do Item, Quantidade e Preço Unitário (ou Custo).
      
      Retorne APENAS um array JSON no seguinte formato:
      [
        {"name": "ANEL BANHADO", "quantity": 5, "unitCost": 25.50},
        ...
      ]
      
      Importante:
      1. Se não conseguir ler algum valor, use 0.
      2. Remova símbolos de moeda (R$).
      3. Se o item for uma joia, mantenha o nome curto e em maiúsculas.
    `

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image.split(",")[1],
          mimeType: "image/jpeg"
        }
      }
    ])

    const response = await result.response
    const text = response.text()
    
    // Limpar a resposta para garantir que seja apenas JSON
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim()
    const data = JSON.parse(jsonStr)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro na IA de Romaneio:", error)
    return NextResponse.json({ error: "Falha ao processar o romaneio" }, { status: 500 })
  }
}
