const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testImageAnalysis() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const models = ["gemini-flash-latest", "gemini-pro-latest"];
  const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  for (const modelName of models) {
    try {
      console.log(`📸 Testando análise de imagem com ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        "Analise esta imagem e diga 'OK' se conseguir ver.",
        { inlineData: { data: base64Image, mimeType: "image/png" } }
      ]);
      const response = await result.response;
      console.log(`✅ Resposta da IA (${modelName}):`, response.text());
    } catch (err) {
      console.error(`❌ ERRO com ${modelName}:`, err.message);
    }
  }
}

testImageAnalysis();
