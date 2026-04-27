const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const key = "AIzaSyA65lEHUEizIsNtlbNo-l2K18dT680nsaM";
const genAI = new GoogleGenerativeAI(key);

async function testFoundKey() {
  try {
    console.log("🔍 TESTANDO CHAVE ENCONTRADA NOS BACKUPS...");
    const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" });
    const result = await model.generateContent("Oi, você está ativa?");
    const response = await result.response;
    console.log("✅ SUCESSO ABSOLUTO! A IA RESPONDEU:", response.text());
  } catch (error) {
    console.error("❌ ESSA CHAVE TAMBÉM FALHOU:", error.message);
  }
}

testFoundKey();
