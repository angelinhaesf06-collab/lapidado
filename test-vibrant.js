const Vibrant = require('node-vibrant/node');

async function test() {
  console.log("🧪 INICIANDO TESTE DE EXTRAÇÃO DE CORES (V4 FIXED)...");
  try {
    console.log("📚 VALIDANDO BIBLIOTECA VIBRANT/NODE...");
    
    // Na V4, dependendo de como o require resolve, pode ser Vibrant ou Vibrant.Vibrant
    const extractor = Vibrant.Vibrant || Vibrant;
    
    if (typeof extractor.from !== 'function') {
      throw new Error("Biblioteca Vibrant não exporta método 'from' no caminho node-vibrant/node");
    }
    
    console.log("✅ BIBLIOTECA CARREGADA COM SUCESSO!");
    console.log("ℹ️  MÉTODO 'from' ENCONTRADO EM:", typeof extractor.from);
    
  } catch (e) {
    console.error("❌ ERRO NO TESTE:", e.message);
    console.log("Dica: Tente usar require('node-vibrant/node') e acessar .Vibrant ou o objeto direto.");
  }
}

test();
