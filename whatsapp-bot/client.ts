/**
 * SPECTER OS — WhatsApp API Client
 * High-performance dispatcher for Meta WhatsApp Cloud API
 */

import { getWhatsAppConfig, sanitizePhoneNumber } from './config';

export interface SendTextOptions {
  to: string;
  text: string;
  previewUrl?: boolean;
}

export interface SendButtonOptions {
  to: string;
  text: string;
  buttons: Array<{ id: string; title: string }>;
}

export interface SendTemplateOptions {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

export interface SendDocumentOptions {
  to: string;
  documentUrl: string;
  filename: string;
  caption?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId: string;
  provider: 'meta_cloud_api' | 'simulation_mode';
  error?: string;
}

export class WhatsAppClient {
  private config = getWhatsAppConfig();

  /**
   * Send a standard plain text WhatsApp message
   */
  async sendText({ to, text, previewUrl = false }: SendTextOptions): Promise<WhatsAppSendResult> {
    const recipient = sanitizePhoneNumber(to);

    if (!this.config.isLive) {
      console.log(`[WhatsApp Bot Simulation] To: ${recipient} | Text: ${text}`);
      return {
        success: true,
        messageId: `sim_msg_${Date.now()}`,
        provider: 'simulation_mode',
      };
    }

    try {
      const url = `${this.config.apiBaseUrl}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'text',
          text: {
            preview_url: previewUrl,
            body: text,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          messageId: '',
          provider: 'meta_cloud_api',
          error: json.error?.message || 'Meta API error',
        };
      }

      return {
        success: true,
        messageId: json.messages?.[0]?.id || `wa_${Date.now()}`,
        provider: 'meta_cloud_api',
      };
    } catch (err: any) {
      return {
        success: false,
        messageId: '',
        provider: 'meta_cloud_api',
        error: err.message,
      };
    }
  }

  /**
   * Send interactive quick-reply buttons (up to 3 buttons)
   */
  async sendInteractiveButtons({ to, text, buttons }: SendButtonOptions): Promise<WhatsAppSendResult> {
    const recipient = sanitizePhoneNumber(to);

    if (!this.config.isLive) {
      console.log(`[WhatsApp Bot Simulation] Quick Buttons To: ${recipient} | Buttons:`, buttons);
      return {
        success: true,
        messageId: `sim_btn_${Date.now()}`,
        provider: 'simulation_mode',
      };
    }

    try {
      const url = `${this.config.apiBaseUrl}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text },
            action: {
              buttons: buttons.slice(0, 3).map((b) => ({
                type: 'reply',
                reply: {
                  id: b.id,
                  title: b.title.slice(0, 20),
                },
              })),
            },
          },
        }),
      });

      const json = await res.json();
      return {
        success: res.ok,
        messageId: json.messages?.[0]?.id || `wa_${Date.now()}`,
        provider: 'meta_cloud_api',
        error: json.error?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        messageId: '',
        provider: 'meta_cloud_api',
        error: err.message,
      };
    }
  }

  /**
   * Send an official pre-approved Meta message template
   */
  async sendTemplate({
    to,
    templateName,
    languageCode = 'en',
    components = [],
  }: SendTemplateOptions): Promise<WhatsAppSendResult> {
    const recipient = sanitizePhoneNumber(to);

    if (!this.config.isLive) {
      console.log(`[WhatsApp Bot Simulation] Template: ${templateName} To: ${recipient}`);
      return {
        success: true,
        messageId: `sim_tpl_${Date.now()}`,
        provider: 'simulation_mode',
      };
    }

    try {
      const url = `${this.config.apiBaseUrl}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
      });

      const json = await res.json();
      return {
        success: res.ok,
        messageId: json.messages?.[0]?.id || '',
        provider: 'meta_cloud_api',
        error: json.error?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        messageId: '',
        provider: 'meta_cloud_api',
        error: err.message,
      };
    }
  }

  /**
   * Send a media document (PDF, PNG, etc.)
   */
  async sendDocument({ to, documentUrl, filename, caption }: SendDocumentOptions): Promise<WhatsAppSendResult> {
    const recipient = sanitizePhoneNumber(to);

    if (!this.config.isLive) {
      console.log(`[WhatsApp Bot Simulation] Document To: ${recipient} | File: ${filename}`);
      return {
        success: true,
        messageId: `sim_doc_${Date.now()}`,
        provider: 'simulation_mode',
      };
    }

    try {
      const url = `${this.config.apiBaseUrl}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'document',
          document: {
            link: documentUrl,
            filename,
            caption,
          },
        }),
      });

      const json = await res.json();
      return {
        success: res.ok,
        messageId: json.messages?.[0]?.id || '',
        provider: 'meta_cloud_api',
        error: json.error?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        messageId: '',
        provider: 'meta_cloud_api',
        error: err.message,
      };
    }
  }
}
