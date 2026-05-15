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
  ENTITLEMENT_ID: 'pro'
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

    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ 
      apiKey: apiKey,
      appUserID: userId
    });
    console.log('✅ RevenueCat configurado com sucesso!');

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
    throw new Error(e.message || 'Erro de conexão com o serviço de assinaturas.');
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
      customerInfo
    }
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('⚠️ Usuário cancelou a compra.');
      return { success: false, cancelled: true };
    }
    
    // 💎 NEXUS: Detecção de processamento do Google (ITEM_UNAVAILABLE)
    const isUnavailable = error.message?.includes('ITEM_UNAVAILABLE') || error.code === '3' || error.message?.includes('Billing is unavailable');
    if (isUnavailable) {
      console.error('🚫 Erro Google Play: ITEM_UNAVAILABLE ou Billing Unavailable.');
    }

    console.error('❌ Erro na compra:', error);
    return { 
      success: false, 
      error: isUnavailable ? 'O faturamento do Google Play está temporariamente indisponível ou processando.' : error.message,
      underlyingError: error.underlyingErrorMessage
    };
  }
}

/**
 * 💎 NEXUS: Mapeador Universal de Planos (Resiliente a IDs customizados)
 */
export async function purchasePlan(planType: 'lite' | 'liteyearly' | 'monthly' | 'yearly') {
  const offerings = await getOfferings();
  if (!offerings) {
    throw new Error('Nenhuma oferta (Offering) configurada como "Current" no RevenueCat. Verifique seu painel.');
  }
  
  let pkg = null;
  const avail = offerings.availablePackages;

  // 💎 Estratégia de Busca:
  // 1. Tentar por IDs customizados comuns (ofrng_lite_mensal, etc)
  // 2. Tentar por aliases padrão do RevenueCat (monthly, annual)
  // 3. Tentar por substrings nos identificadores

  if (planType === 'lite') {
    pkg = offerings.monthly || 
          avail.find(p => p.identifier.includes('lite') && (p.identifier.includes('mon') || p.identifier.includes('mensal'))) ||
          avail.find(p => p.identifier === 'lite');
  } 
  else if (planType === 'liteyearly') {
    pkg = offerings.annual || (offerings as any).yearly ||
          avail.find(p => p.identifier.includes('lite') && (p.identifier.includes('ann') || p.identifier.includes('year') || p.identifier.includes('anual'))) ||
          avail.find(p => p.identifier === 'lite_yearly');
  } 
  else if (planType === 'monthly') { // Pro Monthly
    pkg = avail.find(p => (p.identifier.includes('pro') || p.identifier.includes('monthly_2')) && (p.identifier.includes('mon') || p.identifier.includes('mensal'))) ||
          (offerings as any).lifetime || // Fallback legado para o erro identificado
          offerings.monthly; // Último recurso
  } 
  else if (planType === 'yearly') { // Pro Yearly
    pkg = offerings.annual || (offerings as any).yearly ||
          avail.find(p => (p.identifier.includes('pro') || p.identifier.includes('yearly_2')) && (p.identifier.includes('ann') || p.identifier.includes('year') || p.identifier.includes('anual')));
  }

  if (!pkg) {
    console.error(`❌ Pacote ${planType} não mapeado. Disponíveis:`, avail.map(p => p.identifier));
    const availableStr = avail.map(p => p.identifier).join(', ');
    throw new Error(`O plano ${planType.toUpperCase()} não foi localizado na loja. Disponíveis: ${availableStr}`);
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
