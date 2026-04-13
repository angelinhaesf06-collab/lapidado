const fetch = require('node-fetch');

async function testExtraction() {
  console.log("🧪 TESTANDO API DE EXTRAÇÃO DE CORES...");
  
  // Imagem 1x1 vermelha em base64 para teste
  const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  try {
    const response = await fetch('http://localhost:3000/api/admin/extract-colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ API RESPONDEU COM SUCESSO!");
      console.log("🎨 CORES EXTRAÍDAS:", data);
      
      if (data.primary && data.secondary) {
        console.log("✨ TESTE CONCLUÍDO: Extração funcional.");
      } else {
        console.log("⚠️ ATENÇÃO: A API respondeu, mas os campos de cor estão incompletos.");
      }
    } else {
      console.error("❌ ERRO NA API:", data.error || response.statusText);
    }
  } catch (error) {
    console.error("❌ FALHA NA CONEXÃO COM O SERVIDOR:", error.message);
    console.log("Dica: Verifique se o servidor 'npm run dev' ainda está rodando na porta 3000.");
  }
}

testExtraction();
