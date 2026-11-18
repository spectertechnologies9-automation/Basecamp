/**
 * SPECTER OS — WhatsApp Webhook Processor
 * Verifies and parses incoming Webhooks from Meta Cloud API
 */

import crypto from 'crypto';
import { getWhatsAppConfig } from '../config';
import { handleWhatsAppMessage } from './commands';
import { WhatsAppClient } from '../client';

export interface WebhookVerificationQuery {
  mode: string | null;
  verifyToken: string | null;
  challenge: string | null;
}

export class WhatsAppWebhookHandler {
  private config = getWhatsAppConfig();
  private client = new WhatsAppClient();

  /**
   * Verify challenge from Meta Dashboard
   */
  verify(query: WebhookVerificationQuery): { isValid: boolean; challenge?: string } {
    const { mode, verifyToken, challenge } = query;
    if (mode === 'subscribe' && verifyToken === this.config.webhookVerifyToken && challenge) {
      return { isValid: true, challenge };
    }
    return { isValid: false };
  }

  /**
   * Validate SHA-256 HMAC signature from request headers
   */
  validateSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!this.config.appSecret) return true; // Optional if not set in dev
    if (!signatureHeader) return false;

    const expected = 'sha256=' + crypto.createHmac('sha256', this.config.appSecret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  }

  /**
   * Process incoming payload from Meta
   */
  async processPayload(payload: any): Promise<{ handled: boolean; repliesSent: number }> {
    if (payload.object !== 'whatsapp_business_account') {
      return { handled: false, repliesSent: 0 };
    }

    let repliesSent = 0;

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];

        for (const msg of messages) {
          const from = msg.from; // Phone number
          const contact = contacts.find((c: any) => c.wa_id === from);
          const senderName = contact?.profile?.name || 'Team Member';

          let textContent = '';
          if (msg.type === 'text') {
            textContent = msg.text?.body || '';
          } else if (msg.type === 'interactive') {
            textContent = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || '';
          }

          if (textContent && from) {
            const reply = await handleWhatsAppMessage(textContent, {
              phoneNumber: from,
              senderName,
            });

            await this.client.sendText({ to: from, text: reply });
            repliesSent++;
          }
        }
      }
    }

    return { handled: true, repliesSent };
  }
}
