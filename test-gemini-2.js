const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'C:/Users/Angela/site-com-ia/lapidado-app/.env.local' });

async function testGemini2() {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    console.error("❌ CHAVE GEMINI NÃO ENCONTRADA NO .ENV.LOCAL");
    return;
  }

  console.log("🚀 TESTANDO GEMINI 2.0 FLASH...");
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: "Aja como especialista em joias. Retorne APENAS um JSON: {\"name\": \"...\", \"category\": \"...\", \"description\": \"...\"}"
    });

    const result = await model.generateContent("Descreva um anel de ouro luxuoso.");
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ RESPOSTA RECEBIDA:");
    console.log(text);
  } catch (error) {
    console.error("❌ ERRO NO TESTE:");
    console.error(error.message);
    
    if (error.message.includes("not found")) {
      console.log("💡 DICA: O modelo 'gemini-2.0-flash' pode não estar disponível para sua chave ainda. Tentando 1.5...");
    }
  }
}

testGemini2();
