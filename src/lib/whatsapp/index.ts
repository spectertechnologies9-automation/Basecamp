import crypto from 'crypto';
import { execute, query, queryOne } from '@/lib/db';
import { WHATSAPP_API_BASE, WHATSAPP_API_VERSION } from '@/lib/constants';

export interface WhatsAppMessageOptions {
  to: string;
  message: string;
  organizationId?: string;
  projectId?: string;
  userId?: string;
  sender?: 'user' | 'bot' | 'system';
}

export interface WhatsAppConfigStatus {
  isConfigured: boolean;
  phoneNumberId: string;
  apiVersion: string;
  webhookVerifyToken: string;
  status: 'live_meta' | 'simulation';
}

export function getWhatsAppConfigStatus(): WhatsAppConfigStatus {
  const isConfigured = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  );

  return {
    isConfigured,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? `***${process.env.WHATSAPP_PHONE_NUMBER_ID.slice(-4)}` : 'Not Set',
    apiVersion: WHATSAPP_API_VERSION || 'v20.0',
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'specteros_webhook_token_2026',
    status: isConfigured ? 'live_meta' : 'simulation',
  };
}

export function cleanPhoneNumber(phone: string): string {
  // Strip spaces, dashes, parentheses and leading plus if Meta format requires pure numbers
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

export async function sendWhatsAppMessage({
  to,
  message,
  organizationId = 'org_default',
  projectId,
  userId = 'usr_system',
  sender = 'system',
}: WhatsAppMessageOptions): Promise<{ success: boolean; provider: string; messageId: string; error?: string }> {
  const cleanPhone = cleanPhoneNumber(to);
  const now = new Date().toISOString();
  const internalId = `wamsg_${crypto.randomBytes(8).toString('hex')}`;

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // 1. Meta WhatsApp Business Cloud API Integration
  if (token && phoneNumberId) {
    try {
      const url = `${WHATSAPP_API_BASE}/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      });

      const json = await res.json();
      if (res.ok && json.messages?.[0]?.id) {
        const metaId = json.messages[0].id;
        await logWhatsAppMessage({
          id: internalId,
          organizationId,
          userId,
          projectId,
          phoneNumber: to,
          sender,
          body: message,
          status: 'delivered',
          createdAt: now,
        });
        return { success: true, provider: 'meta_cloud_api', messageId: metaId };
      } else {
        console.warn('[Meta WhatsApp Cloud API Error]:', json);
      }
    } catch (err: any) {
      console.error('Meta WhatsApp delivery failed, falling back to local simulation:', err.message);
    }
  }

  // 2. Local Simulation Mode (Records in SQLite whatsapp_messages and console)
  console.log(`[SPECTER OS WHATSAPP ENGINE — DISPATCH]
To: ${to} (Cleaned: ${cleanPhone})
Sender: ${sender}
Date: ${now}
Provider: local_simulation
Content:
${message}
-------------------------------------------------------------`);

  await logWhatsAppMessage({
    id: internalId,
    organizationId,
    userId,
    projectId,
    phoneNumber: to,
    sender,
    body: message,
    status: 'simulated_delivered',
    createdAt: now,
  });

  return { success: true, provider: 'simulation', messageId: internalId };
}

async function logWhatsAppMessage({
  id,
  organizationId,
  userId,
  projectId,
  phoneNumber,
  sender,
  body,
  status,
  createdAt,
}: {
  id: string;
  organizationId: string;
  userId: string;
  projectId?: string;
  phoneNumber: string;
  sender: string;
  body: string;
  status: string;
  createdAt: string;
}) {
  try {
    await execute(
      `INSERT INTO whatsapp_messages (id, organization_id, user_id, phone_number, sender, body, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, organizationId, userId, phoneNumber, sender, body, status, createdAt]
    );

    // Audit log
    await execute(
      'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`aud_${crypto.randomBytes(8).toString('hex')}`, organizationId, userId, `dispatched WhatsApp to ${phoneNumber}`, 'whatsapp', id, createdAt]
    );
  } catch (err) {
    console.error('Failed to log WhatsApp message:', err);
  }
}

export async function generateWhatsAppBotReply(incomingText: string): Promise<string> {
  const lower = incomingText.toLowerCase().trim();

  if (lower.includes('task') || lower.includes('todo')) {
    const openTodos = await query<any>("SELECT title, status, due_date FROM todos WHERE status != 'completed' LIMIT 5");
    if (!openTodos || openTodos.length === 0) {
      return "All clear! You currently have zero pending tasks in your SPECTER OS workspace.";
    }
    const list = openTodos.map((t: any, idx: number) => `${idx + 1}. ${t.title} [${t.status}]${t.due_date ? ` (Due: ${t.due_date})` : ''}`).join('\n');
    return `SPECTER OS Task Status:\n${list}\n\nAccess your workspace: http://localhost:3000/dashboard`;
  }

  if (lower.includes('project') || lower.includes('status')) {
    const projects = await query<any>('SELECT name, status, due_date FROM projects ORDER BY created_at DESC LIMIT 4');
    if (!projects || projects.length === 0) {
      return "No active projects found in workspace.";
    }
    const list = projects.map((p: any) => `• ${p.name} — Status: ${p.status.toUpperCase()}${p.due_date ? ` (Target: ${p.due_date})` : ''}`).join('\n');
    return `SPECTER OS Active Projects:\n${list}\n\nLog in for full details: http://localhost:3000/projects`;
  }

  if (lower.includes('deadline') || lower.includes('milestone') || lower.includes('schedule')) {
    const milestones = await query<any>('SELECT title, start_at FROM calendar_events ORDER BY start_at ASC LIMIT 4');
    if (!milestones || milestones.length === 0) {
      return "No upcoming calendar milestones scheduled.";
    }
    const list = milestones.map((m: any) => `• ${m.title} — ${m.start_at ? m.start_at.slice(0, 10) : 'TBD'}`).join('\n');
    return `Upcoming Milestones:\n${list}`;
  }

  if (lower.includes('hi') || lower.includes('hello') || lower.includes('help')) {
    return `SPECTER OS WhatsApp Assistant\n\nYou can message me with:\n• tasks — view current open tasks\n• status — check active project status\n• deadlines — view upcoming project milestones\n\nConnected to SPECTER OS intelligence hub.`;
  }

  return `Received: "${incomingText}". Synced to your SPECTER OS workspace timeline. Reply "help" for command options.`;
}
