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

export const GOOGLE_PLAY_PLANS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
}

export async function initializeBilling(userId?: string) {
  if (!Capacitor.isNativePlatform()) {
    console.log('💻 Rodando em Web: Google Play Billing desativado.');
    return false;
  }

  try {
    console.log('📡 Inicializando RevenueCat (Google Play)...');
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ 
      apiKey: REVENUECAT_CONF.GOOGLE_API_KEY,
      appUserID: userId
    });
    return true;
  } catch (e) {
    console.error('❌ Falha ao configurar RevenueCat:', e);
    return false;
  }
}

export async function getOfferings() {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.error('❌ Erro ao buscar ofertas:', e);
    return null;
  }
}

export async function purchasePackage(rcPackage: any) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('As compras só podem ser realizadas no aplicativo nativo.');
  }

  try {
    console.log(`🛒 Iniciando compra do pacote: ${rcPackage.identifier}`);
    const { purchaserInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
    
    const isActive = purchaserInfo.entitlements.active[REVENUECAT_CONF.ENTITLEMENT_ID] !== undefined;
    
    return {
      success: isActive,
      purchaserInfo
    }
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('⚠️ Usuário cancelou a compra.');
      return { success: false, cancelled: true };
    }
    console.error('❌ Erro na compra:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Compatibility Wrapper for Legacy UI code
 */
export async function purchasePlan(planType: 'monthly' | 'yearly') {
  const offerings = await getOfferings();
  if (!offerings) throw new Error('Nenhuma oferta disponível no momento.');
  
  const pkg = planType === 'monthly' ? offerings.monthly : offerings.annual;
  if (!pkg) throw new Error(`Pacote ${planType} não encontrado no RevenueCat.`);
  
  return await purchasePackage(pkg);
}

/**
 * Sincroniza o status da assinatura com o Supabase após compra no Google Play
 */
export async function syncSubscriptionWithSupabase(supabase: any, userId: string, purchaserInfo: any) {
  const entitlement = purchaserInfo.entitlements.active[REVENUECAT_CONF.ENTITLEMENT_ID];
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
