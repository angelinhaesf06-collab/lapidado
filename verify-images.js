const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyImages() {
  console.log("🔍 VERIFICANDO IMAGENS DOS PRODUTOS...");
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, image_url');

    if (error) throw error;

    if (!products || products.length === 0) {
      console.log("⚠️ Nenhum produto encontrado.");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let validCount = 0;
    let invalidCount = 0;

    products.forEach(product => {
      const url = product.image_url;
      const isValid = url && url.startsWith(supabaseUrl) && url.includes('/storage/v1/object/public/');
      
      if (isValid) {
        validCount++;
        // console.log(`✅ [${product.name}] URL válida: ${url}`);
      } else {
        invalidCount++;
        console.log(`❌ [${product.name}] URL INVÁLIDA ou EXTERNA: ${url || 'VAZIA'}`);
      }
    });

    console.log(`\n📊 RESUMO:`);
    console.log(`✅ Válidas (Supabase Storage): ${validCount}`);
    console.log(`❌ Inválidas ou Outras: ${invalidCount}`);
    console.log(`Total: ${products.length}`);

  } catch (e) {
    console.error("❌ ERRO AO VERIFICAR IMAGENS:", e.message);
  }
}

verifyImages();
