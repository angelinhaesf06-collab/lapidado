const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'C:/Users/Angela/site-com-ia/lapidado-app/.env.local' });

async function discoverModels() {
  const apiKey = "AIzaSyBeZQ3z9gIFEPBFXo4tY202XU19dIQVX1E"; // Sua chave
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("-----------------------------------------");
    console.log("🔍 SOLICITANDO LISTA OFICIAL DO GOOGLE...");
    
    // O SDK permite listar os modelos disponíveis para a chave
    // Vamos usar a API diretamente para garantir que vemos tudo
    const fetch = require('node-fetch');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.models) {
      console.log("✅ MODELOS DISPONÍVEIS NA SUA CONTA:");
      data.models.forEach(m => {
        console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
      });
    } else {
      console.log("❌ NENHUM MODELO ENCONTRADO OU ERRO NA CHAVE:");
      console.log(JSON.stringify(data, null, 2));
    }
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("❌ ERRO AO CONECTAR COM O GOOGLE:", error.message);
  }
}

discoverModels();
