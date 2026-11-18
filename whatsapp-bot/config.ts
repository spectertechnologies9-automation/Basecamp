/**
 * SPECTER OS — WhatsApp Bot Configuration
 * Dedicated configuration & environment resolver for WhatsApp Cloud API & Baileys
 */

export interface WhatsAppBotConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookVerifyToken: string;
  appSecret?: string;
  apiVersion: string;
  apiBaseUrl: string;
  isLive: boolean;
}

export function getWhatsAppConfig(): WhatsAppBotConfig {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const webhookVerifyToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'specteros_webhook_token_2026';
  const appSecret = process.env.WHATSAPP_APP_SECRET || '';
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';
  const apiBaseUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`;

  const isLive = Boolean(phoneNumberId && accessToken);

  return {
    phoneNumberId,
    businessAccountId,
    accessToken,
    webhookVerifyToken,
    appSecret,
    apiVersion,
    apiBaseUrl,
    isLive,
  };
}

export function sanitizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}
