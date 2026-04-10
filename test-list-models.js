const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  try {
    const models = await genAI.listModels();
    console.log("Modelos disponíveis:");
    models.forEach(m => console.log(m.name));
  } catch (error) {
    console.error("ERRO ao listar modelos:", error.message);
  }
}

run();
