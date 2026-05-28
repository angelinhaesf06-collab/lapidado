/**
 * 💎 NEXUS: GOOGLE PLAY BILLING SERVICE
 * Este serviço gerencia a comunicação com a API do Google Play via Capacitor.
 */

import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

/**
 * 💎 NEXUS: GOOGLE PLAY BILLING SERVICE (REVENUECAT)
 * Este serviço gerencia a comunicação com a API do Google Play de forma nativa.
 */

export const REVENUECAT_CONF = {
  GOOGLE_API_KEY: process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_placeholder',
  ENTITLEMENT_ID: 'Lapidado Pro'
}

export const isNative = Capacitor.isNativePlatform();

export const GOOGLE_PLAY_PLANS = {
  LITE: 'lite',
  LITE_YEARLY: 'liteyearly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
} as const

export async function initializeBilling(userId?: string, supabase?: any) {
  if (!isNative) {
    console.log('💻 Rodando em Web: Google Play Billing desativado.');
    return false;
  }

  try {
    const apiKey = REVENUECAT_CONF.GOOGLE_API_KEY.trim();
    console.log('📡 Inicializando RevenueCat (Google Play)...');

    if (apiKey === 'goog_placeholder' || !apiKey) {
      const msg = '❌ ERRO: NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY não localizada! Verifique as variáveis de ambiente no Vercel.';
      console.error(msg);
      if (isNative) alert(msg);
      return false;
    }

    console.log(`📡 Chave detectada (início): ${apiKey.substring(0, 8)}...`);
    console.log(`📡 DEBUG: Comprimento da chave: ${apiKey.length}`);

    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    console.log(`📡 Configurando RevenueCat com chave: ${apiKey.substring(0, 10)}...`);
    
    await Purchases.configure({ 
      apiKey: apiKey,
      appUserID: userId
    });
    console.log('✅ RevenueCat configurado com sucesso!');

    // Teste imediato de conexão
    try {
      const offerings = await Purchases.getOfferings();
      console.log('🎁 Ofertas carregadas na inicialização:', offerings);
    } catch (offeringErr: any) {
      console.error('❌ Erro ao validar ofertas após configure:', offeringErr);
    }

    // 💎 NEXUS: Sincronização Automática Silenciosa (Startup)
    // Se tivermos o userId e o cliente Supabase, verificamos o status real agora.
    if (userId && supabase) {
      console.log('🔄 Iniciando sincronização silenciosa de assinatura...');
      try {
        const { customerInfo } = await Purchases.getCustomerInfo();
        await syncSubscriptionWithSupabase(supabase, userId, customerInfo);
        console.log('✨ Sincronização de startup concluída.');
      } catch (syncErr) {
        console.warn('⚠️ Falha na sincronização silenciosa inicial (usuário pode estar offline):', syncErr);
      }
    }

    return true;
  } catch (e) {
    console.error('❌ Falha ao configurar RevenueCat:', e);
    return false;
  }
}

export async function getOfferings() {
  if (!isNative) {
    console.warn('⚠️ getOfferings chamado fora de plataforma nativa');
    return null;
  }
  try {
    console.log('📡 Buscando ofertas no RevenueCat...');
    const offerings = await Purchases.getOfferings();
    
    if (!offerings || !offerings.all || Object.keys(offerings.all).length === 0) {
      console.warn('⚠️ Nenhuma oferta encontrada na configuração do RevenueCat.');
      return null;
    }

    // 💎 NEXUS: Fallback inteligente - se não houver 'current', pega a primeira disponível
    const selectedOffering = offerings.current || Object.values(offerings.all)[0];

    if (selectedOffering) {
      console.log(`🎁 Oferta Selecionada: ${selectedOffering.identifier} (${offerings.current ? 'Current' : 'Fallback'})`);
      console.log('📦 Pacotes Disponíveis:', selectedOffering.availablePackages.map(p => p.identifier).join(', '));
    }

    return selectedOffering || null;
  } catch (e: any) {
    console.error('❌ Erro crítico ao buscar ofertas no RevenueCat:', e);
    
    const errorMsg = e.message || '';
    const errorCode = e.code || '';
    
    // 💎 Detecção de Erro de Configuração (Case Insensitive)
    const isConfigError = 
      errorMsg.toLowerCase().includes('configuration') || 
      errorMsg.toLowerCase().includes('offerings') || 
      errorCode === 'THERE_IS_AN_ISSUE_WITH_YOUR_CONFIGURATION';

    const maskedKey = REVENUECAT_CONF.GOOGLE_API_KEY ? 
      `${REVENUECAT_CONF.GOOGLE_API_KEY.substring(0, 5)}...${REVENUECAT_CONF.GOOGLE_API_KEY.slice(-5)}` : 
      'NÃO DEFINIDA';

    if (isConfigError) {
      throw new Error(`DIAGNÓSTICO LAPIDADO: Erro de Configuração no RevenueCat.\n\n` +
        `1. Bundle ID do App: com.lapidado.vendas\n` +
        `2. Chave usada: ${maskedKey}\n` +
        `3. Erro Original: ${errorMsg}\n\n` +
        `Verifique se o Bundle ID e a API Key coincidem com o painel do RevenueCat.`);
    }

    throw new Error(errorMsg || 'Erro de conexão com o serviço de assinaturas.');
  }
}

export async function purchasePackage(rcPackage: any) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('As compras só podem ser realizadas no aplicativo nativo.');
  }

  try {
    console.log(`🛒 Iniciando compra do pacote: ${rcPackage.identifier} (${rcPackage.product.identifier})`);
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
    
    const isActive = customerInfo.entitlements.active[REVENUECAT_CONF.ENTITLEMENT_ID] !== undefined;
    
    return {
      success: isActive,
      customerInfo,
      purchaserInfo: customerInfo // 💎 NEXUS: Alias para compatibilidade com layout.tsx
    }
  } catch (error: any) {
    console.error('❌ Erro na compra:', error);
    
    // 💎 NEXUS: Detecção Robusta de Cancelamento (vários formatos de erro)
    const isCancelled = 
      error.userCancelled || 
      error.code === '1' || 
      error.code === 1 || 
      error.message?.toLowerCase().includes('cancelled') || 
      error.message?.toLowerCase().includes('cancelado');

    if (isCancelled) {
      console.log('⚠️ Usuário cancelou a compra ou sistema reportou cancelamento.');
      return { success: false, cancelled: true };
    }
    
    // 💎 NEXUS: Detecção de processamento do Google (ITEM_UNAVAILABLE)
    const isUnavailable = error.message?.includes('ITEM_UNAVAILABLE') || error.code === '3' || error.code === 3 || error.message?.includes('Billing is unavailable');
    if (isUnavailable) {
      console.error('🚫 Erro Google Play: ITEM_UNAVAILABLE ou Billing Unavailable.');
    }

    return { 
      success: false, 
      error: isUnavailable ? 'O faturamento do Google Play está temporariamente indisponível ou processando.' : error.message,
      errorCode: error.code,
      underlyingError: error.underlyingErrorMessage
    };
  }
}

/**
 * 💎 NEXUS: Mapeador Universal de Planos (Resiliente a IDs customizados)
 */
export async function purchasePlan(planType: 'lite' | 'liteyearly' | 'monthly' | 'yearly') {
  let selectedOffering = null;
  
  try {
    selectedOffering = await getOfferings();
  } catch (e: any) {
    console.error('❌ Falha ao obter ofertas:', e);
    throw e; // Repassa o erro detalhado do getOfferings
  }
  
  if (!selectedOffering) {
    throw new Error('CONFIGURAÇÃO REVENUECAT: Nenhuma oferta encontrada. 1. Verifique se existe uma "Offering" marcada como CURRENT. 2. Verifique se o Bundle ID no painel é com.lapidado.vendas.');
  }
  
  let pkg = null;
  
  // 💎 NEXUS: Estratégia de Varredura Global (Busca em todos os pacotes da oferta selecionada)
  const allPackages = selectedOffering.availablePackages;

  console.log(`📡 Varrendo ${allPackages.length} pacotes em busca de: ${planType}`);

  if (planType === 'lite') {
    pkg = allPackages.find(p => p.identifier === 'lite' || p.identifier === '$rc_monthly' || p.identifier === 'assinatura_mensal_lite' || p.product.identifier.includes('mensal_lite'));
  } 
  else if (planType === 'liteyearly') {
    pkg = allPackages.find(p => p.identifier === 'liteyearly' || p.identifier === '$rc_annual' || p.identifier === 'assinatura_anual_lite' || p.product.identifier.includes('anual_lite'));
  } 
  else if (planType === 'monthly') {
    pkg = allPackages.find(p => p.identifier === 'monthly' || p.identifier === 'custom_lifetime' || p.identifier === 'assinatura_mensal_pro' || p.product.identifier.includes('mensal_pro'));
  } 
  else if (planType === 'yearly') {
    pkg = allPackages.find(p => p.identifier === 'yearly' || p.identifier === 'custom_yearly_2' || p.identifier === 'assinatura_anual_pro' || p.product.identifier.includes('anual_pro'));
  }

  if (!pkg) {
    const foundIds = allPackages.map(p => p.identifier).join(', ');
    console.error(`❌ Pacote ${planType} não localizado. Encontrados: ${foundIds}`);
    throw new Error(`Plano ${planType.toUpperCase()} não encontrado na loja.\n\nEncontrados no Google: ${foundIds || 'Nenhum'}`);
  }
  
  return await purchasePlanLegacy(pkg);
}

/**
 * Internal helper to handle the purchase result mapping
 */
async function purchasePlanLegacy(pkg: any) {
  try {
    const result = await purchasePackage(pkg);
    return {
      success: result.success,
      customerInfo: result.customerInfo,
      purchaserInfo: result.customerInfo,
      error: result.error,
      errorCode: (result as any).errorCode,
      cancelled: result.cancelled
    };
  } catch (e: any) {
    return {
      success: false,
      customerInfo: undefined,
      purchaserInfo: undefined,
      error: e.message || 'Erro desconhecido na compra'
    };
  }
}

/**
 * Recupera assinaturas existentes (Obrigatório para Google Play)
 */
export async function restorePurchases() {
  if (!Capacitor.isNativePlatform()) return { success: false };
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const isActive = customerInfo.entitlements.active[REVENUECAT_CONF.ENTITLEMENT_ID] !== undefined;
    return { success: isActive, customerInfo };
  } catch (e) {
    console.error('❌ Erro ao restaurar compras:', e);
    return { success: false };
  }
}

/**
 * Sincroniza o status da assinatura com o Supabase após compra no Google Play
 */
export async function syncSubscriptionWithSupabase(supabase: any, userId: string, customerInfo: any) {
  const entitlement = customerInfo.entitlements.active[REVENUECAT_CONF.ENTITLEMENT_ID];
  if (!entitlement) return false;

  const { error } = await supabase
    .from('branding')
    .update({
      subscription_status: 'active',
      google_play_subscription_id: entitlement.productIdentifier,
      subscription_expires_at: entitlement.expirationDate
    })
    .eq('user_id', userId)

  return !error
}
