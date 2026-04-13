const fetch = require('node-fetch');
require('dotenv').config();

async function list() {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Modelos Disponíveis:");
    data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
  } catch (e) {
    console.error("ERRO:", e.message);
  }
}

list();
