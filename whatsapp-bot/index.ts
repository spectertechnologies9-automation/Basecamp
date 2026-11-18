/**
 * SPECTER OS — WhatsApp Bot Module Exports
 */

export * from './config';
export * from './client';
export * from './handlers/commands';
export * from './handlers/webhook';
export * from './services/notification';

import { WhatsAppClient } from './client';
import { WhatsAppWebhookHandler } from './handlers/webhook';
import { WhatsAppNotificationService } from './services/notification';

export const whatsAppClient = new WhatsAppClient();
export const whatsAppWebhook = new WhatsAppWebhookHandler();
export const whatsAppNotification = new WhatsAppNotificationService();
