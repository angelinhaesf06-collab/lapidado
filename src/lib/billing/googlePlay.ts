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

export async function initializeBilling(userId?: string) {
  if (!isNative) {
    console.log('💻 Rodando em Web: Google Play Billing desativado.');
    return false;
  }

  try {
    const apiKey = REVENUECAT_CONF.GOOGLE_API_KEY;
    console.log('📡 Inicializando RevenueCat (Google Play)...');

    if (apiKey === 'goog_placeholder' || !apiKey) {
      console.error('❌ ERRO: NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY não configurada no ambiente!');
      return false;
    }

    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ 
      apiKey: apiKey,
      appUserID: userId
    });
    console.log('✅ RevenueCat configurado com sucesso!');
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
    
    // 💎 NEXUS: Fallback inteligente - se não houver 'current', pega a primeira disponível
    const selectedOffering = offerings.current || Object.values(offerings.all)[0];

    if (selectedOffering) {
      console.log(`🎁 Oferta Selecionada: ${selectedOffering.identifier} (${offerings.current ? 'Current' : 'Fallback'})`);
      console.log('📦 Pacotes:', selectedOffering.availablePackages.map(p => p.identifier).join(', '));
    } else {
      console.warn('⚠️ Nenhuma oferta (current ou all) encontrada no RevenueCat.');
    }

    return selectedOffering || null;
  } catch (e: any) {
    console.error('❌ Erro ao buscar ofertas:', e);
    return null;
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
    const isUnavailable = error.message?.includes('ITEM_UNAVAILABLE') || error.code === '3';
    if (isUnavailable) {
      console.error('🚫 Erro Google Play: ITEM_UNAVAILABLE. O Google ainda está processando a nova versão ou o produto.');
    }

    console.error('❌ Erro na compra:', error);
    return { 
      success: false, 
      error: isUnavailable ? 'O Google Play ainda está processando este item. Tente novamente em alguns minutos.' : error.message 
    };
  }
}

/**
 * Compatibility Wrapper for Legacy UI code
 */
export async function purchasePlan(planType: 'lite' | 'liteyearly' | 'monthly' | 'yearly') {
  const offerings = await getOfferings();
  if (!offerings) throw new Error('Nenhuma oferta disponível no momento.');
  
  let pkg;
  // 💎 NEXUS: Mapeamento exato com base no print da Angela (ofrng5100c63ea8)
  // Usamos (offerings as any) para evitar erros de build com IDs customizados
  if (planType === 'lite') pkg = offerings.monthly; 
  else if (planType === 'liteyearly') pkg = offerings.annual || (offerings as any).yearly; 
  else if (planType === 'monthly') pkg = (offerings as any).lifetime || (offerings as any).custom_lifetime; 
  else pkg = (offerings as any).yearly_2 || (offerings as any).custom_yearly_2;

  if (!pkg) {
    console.error(`Pacote ${planType} não encontrado. Ofertas disponíveis:`, Object.keys(offerings));
    const available = offerings.availablePackages.map(p => p.identifier).join(', ');
    throw new Error(`O plano ${planType.toUpperCase()} não foi localizado. Pacotes na vitrine: ${available}`);
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
