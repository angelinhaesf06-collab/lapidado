const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'C:/Users/Angela/site-com-ia/lapidado-app/.env.local' });

async function listModels() {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    console.error("❌ CHAVE NÃO ENCONTRADA");
    return;
  }

  console.log("🔍 BUSCANDO MODELOS DISPONÍVEIS PARA SUA CHAVE...");
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // No SDK do Google, podemos listar os modelos para ver o nome exato
    // Mas uma forma mais rápida é testar os nomes de produção 2.0
    const modelsToTest = [
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash",
      "gemini-2.0-pro-exp-02-05",
      "gemini-1.5-pro",
      "gemini-1.5-flash"
    ];

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent("Oi");
        console.log(`✅ DISPONÍVEL: ${modelName}`);
      } catch (e) {
        console.log(`❌ INDISPONÍVEL: ${modelName} (${e.message.substring(0, 50)}...)`);
      }
    }
  } catch (error) {
    console.error("Erro ao listar:", error.message);
  }
}

listModels();
