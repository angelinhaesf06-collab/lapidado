const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  console.log("🔍 LISTANDO MODELOS DIRETAMENTE...");
  try {
    // Tentativa de listar modelos para ver quais estão ativos para esta chave
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("RESPOSTA DA API:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("ERRO NA REQUISIÇÃO:", err.message);
  }
}

listModels();
