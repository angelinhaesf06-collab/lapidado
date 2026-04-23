const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function run() {
  console.log("DEBUG: process.env.GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);
  console.log("DEBUG: process.env.GEMINI_API_KEY starts with AIzaSyC:", process.env.GEMINI_API_KEY?.startsWith('AIzaSyC'));
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY?.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  try {
    const result = await model.generateContent("Olá, responda com OK se estiver funcionando.");
    const response = await result.response;
    console.log("Resposta do Gemini:", response.text());
  } catch (error) {
    console.error("Erro no Gemini:", error.message);
    if (error.stack) console.error(error.stack);
  }
}

run();
