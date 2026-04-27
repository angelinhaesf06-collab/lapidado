const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'C:/Users/Angela/site-com-ia/lapidado-app/.env.local' });

async function testPaid() {
  const apiKey = "AIzaSyBeZQ3z9gIFEPBFXo4tY202XU19dIQVX1E"; // Usando a chave do seu .env
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Nomes comuns para modelos de produção/pagos
  const modelName = "gemini-2.0-flash-001"; 
  
  console.log(`🚀 TESTANDO MODELO DE PRODUÇÃO: ${modelName}`);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Descreva uma joia.");
    console.log("✅ SUCESSO!");
    console.log(result.response.text());
  } catch (e) {
    console.log(`❌ FALHOU: ${e.message}`);
  }
}

testPaid();
