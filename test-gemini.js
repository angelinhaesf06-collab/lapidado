const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(key);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
    const result = await model.generateContent("Olá, quem é você?");
    const response = await result.response;
    const text = response.text();
    console.log("SUCESSO:", text);
  } catch (error) {
    console.error("ERRO:", error.message);
  }
}

run();
