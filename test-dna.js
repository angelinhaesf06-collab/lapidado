const fetch = require('node-fetch');
require('dotenv').config();

async function testBrandingDNA() {
  console.log("🧪 TESTANDO EXTRAÇÃO DE DNA (CORES + FONTE)...");
  
  // Imagem 1x1 vermelha em base64 para teste
  const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  try {
    const response = await fetch('http://localhost:3000/api/admin/extract-branding-dna', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ API DNA RESPONDEU COM SUCESSO!");
      console.log("🧬 DNA EXTRAÍDO:", data);
    } else {
      console.error("❌ ERRO NA API DNA:", data.error || data);
    }
  } catch (error) {
    console.error("❌ FALHA NA CONEXÃO:", error.message);
  }
}

testBrandingDNA();
