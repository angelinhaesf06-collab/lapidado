const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function cleanupDuplicates() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log("🧹 Iniciando limpeza de marcas duplicadas...")
  
  // 1. Identificar usuários com mais de um registro de branding
  const { data: allBranding, error } = await supabase
    .from('branding')
    .select('id, user_id, updated_at, business_name, slug')
    .order('updated_at', { ascending: true })

  if (error) {
    console.error("❌ Erro ao buscar marcas:", error.message)
    return
  }

  const userGroups = {}
  allBranding.forEach(b => {
    if (!userGroups[b.user_id]) userGroups[b.user_id] = []
    userGroups[b.user_id].push(b)
  })

  for (const userId in userGroups) {
    const records = userGroups[userId]
    if (records.length > 1) {
      console.log(`⚠️ Usuário ${userId} possui ${records.length} registros.`)
      const mainId = records[0].id
      const idsToRemove = records.slice(1).map(r => r.id)
      
      console.log(`✅ Mantendo como principal: ${mainId} (${records[0].business_name})`)
      console.log(`🗑️ Removendo órfãos:`, idsToRemove)
      
      const { error: delError } = await supabase
        .from('branding')
        .delete()
        .in('id', idsToRemove)
        
      if (delError) console.error(`❌ Erro ao remover registros de ${userId}:`, delError.message)
      else console.log(`✨ Limpeza concluída para este usuário.`)
    }
  }
}

cleanupDuplicates()
