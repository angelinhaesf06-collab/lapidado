const fetch = require('node-fetch');
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  console.log("URL de teste (chave mascarada):", url.replace(apiKey, apiKey ? apiKey.substring(0, 5) + "..." : "MISSING"));
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Resposta da API:");
    if (data.models) {
      data.models.forEach(m => {
        console.log(`- ${m.name}`);
      });
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Erro na requisição:", error.message);
  }
}

listModels();
