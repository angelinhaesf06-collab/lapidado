const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro-vision" // Legado
  ];

  console.log("🔍 ESCANEANDO MODELOS DISPONÍVEIS...");

  for (const modelName of modelsToTest) {
    try {
      console.log(`📡 Testando: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Oi");
      const response = await result.response;
      console.log(`✅ SUCESSO com ${modelName}!`);
      return modelName; // Para no primeiro que funcionar
    } catch (e) {
      console.log(`❌ FALHA em ${modelName}: ${e.message.substring(0, 100)}`);
    }
  }
}

testModels();
