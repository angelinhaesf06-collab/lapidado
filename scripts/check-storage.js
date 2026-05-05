const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function checkStorage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log("🔍 Investigando buckets de storage...")
  
  const { data: buckets, error } = await supabase.storage.listBuckets()

  if (error) {
    console.error("❌ Erro ao listar buckets:", error.message)
    return
  }

  console.log("✅ Buckets encontrados:", buckets.map(b => b.name).join(", "))
  
  const requiredBuckets = ['products', 'branding']
  for (const b of requiredBuckets) {
    if (!buckets.find(bucket => bucket.name === b)) {
      console.log(`⚠️ Bucket '${b}' NÃO ENCONTRADO. Tentando criar...`)
      const { data, error: createError } = await supabase.storage.createBucket(b, {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      })
      if (createError) {
        console.error(`❌ Falha ao criar bucket '${b}':`, createError.message)
      } else {
        console.log(`✅ Bucket '${b}' criado com sucesso!`)
      }
    } else {
        console.log(`✅ Bucket '${b}' já existe e está pronto.`)
    }
  }
}

checkStorage()
