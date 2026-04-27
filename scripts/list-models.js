const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("Listing available models...");
    // A API do JS não tem um método direto exposto facilmente em versões antigas, 
    // mas podemos tentar instanciar os modelos mais comuns de 2026.
    const testModels = [
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash",
      "gemini-2.0-pro"
    ];

    for (const m of testModels) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hi");
            console.log(`✅ ${m} is AVAILABLE`);
        } catch (e) {
            console.log(`❌ ${m}: ${e.message.substring(0, 100)}`);
        }
    }
  } catch (err) {
    console.error(err);
  }
}

listModels();
