const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testImageAnalysis() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  // Uma imagem base64 bem pequena (1x1 pixel transparente) para teste de conexão
  const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  try {
    console.log("📸 Testando análise de imagem com gemini-flash-latest...");
    const result = await model.generateContent([
      "Analise esta imagem e diga 'OK' se conseguir ver.",
      { inlineData: { data: base64Image, mimeType: "image/png" } }
    ]);
    const response = await result.response;
    console.log("✅ Resposta da IA:", response.text());
  } catch (err) {
    console.error("❌ ERRO DETALHADO:");
    console.error("Status:", err.status);
    console.error("Mensagem:", err.message);
    if (err.response) {
        console.error("Corpo do Erro:", JSON.stringify(err.response, null, 2));
    }
  }
}

testImageAnalysis();
