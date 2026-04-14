const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  const models = ["gemini-1.5-flash", "gemini-pro"];
  
  for (const m of models) {
    try {
      console.log(`💎 TESTANDO MODELO ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Oi!");
      const response = await result.response;
      console.log(`✅ ${m} FUNCIONOU:`, response.text());
      return; 
    } catch (error) {
      console.error(`❌ ERRO EM ${m}:`, error.message);
    }
  }
}

run();
