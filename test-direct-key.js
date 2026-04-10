const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const key = process.argv[2];
  if (!key) {
    console.error("ERRO: Forneça a chave como argumento.");
    process.exit(1);
  }
  
  const genAI = new GoogleGenerativeAI(key);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Olá, quem é você?");
    const response = await result.response;
    const text = response.text();
    console.log("SUCESSO:", text);
  } catch (error) {
    console.error("ERRO:", error.message);
  }
}

run();
