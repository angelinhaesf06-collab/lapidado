const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function runCheck() {
  console.log("🔍 NEXUS: INICIANDO VALIDAÇÃO FINAL DO MOTOR DE IA...");
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ ERRO: GEMINI_API_KEY não encontrada no .env");
    process.exit(1);
  }

  const keyType = apiKey.startsWith("AIza") ? "AI_STUDIO (AIza)" : 
                  apiKey.startsWith("AQ") ? "GOOGLE_CLOUD (AQ)" : "DESCONHECIDO";
  
  console.log(`📡 TIPO DE CHAVE: ${keyType}`);
  console.log(`🔑 PREFIXO: ${apiKey.substring(0, 8)}...`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTest = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  
  let success = false;

  for (const modelName of modelsToTest) {
    try {
      console.log(`\nTesting model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Teste simples de texto
      const result = await model.generateContent("Diga 'SISTEMA ONLINE' se você consegue ler esta mensagem.");
      const response = await result.response;
      const text = response.text();
      
      if (text.includes("SISTEMA ONLINE") || text.length > 0) {
        console.log(`✅ SUCESSO com ${modelName}: ${text.trim()}`);
        success = true;
        break; 
      }
    } catch (err) {
      const msg = err.message || "";
      console.error(`❌ FALHA com ${modelName}:`);
      
      if (msg.includes("billing")) {
        console.error("   🚨 DIAGNÓSTICO: BILLING_DISABLED. Verifique o console do Google Cloud.");
      } else if (msg.includes("API key")) {
        console.error("   🚨 DIAGNÓSTICO: API_KEY_EXPIRED ou INVÁLIDA.");
      } else if (msg.includes("location") || msg.includes("region")) {
        console.error("   🚨 DIAGNÓSTICO: REGION_NOT_SUPPORTED.");
      } else {
        console.error(`   DETALHES: ${msg}`);
      }
    }
  }

  console.log("\n-------------------------------------------");
  if (success) {
    console.log("🚀 STATUS FINAL: PRONTO PARA PRODUÇÃO");
  } else {
    console.log("🛑 STATUS FINAL: FALHA CRÍTICA - REVISAR DIAGNÓSTICOS ACIMA");
    process.exit(1);
  }
}

runCheck();
