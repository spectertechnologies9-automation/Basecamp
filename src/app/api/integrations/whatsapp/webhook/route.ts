import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { execute, queryOne } from '@/lib/db';
import { sendWhatsAppMessage, generateWhatsAppBotReply } from '@/lib/whatsapp';

/**
 * Meta WhatsApp Cloud API Webhook Handler
 * 
 * Verification Steps:
 * 1. Meta dashboard requests GET /api/integrations/whatsapp/webhook
 *    with hub.mode, hub.verify_token, and hub.challenge
 * 2. Incoming messages arrive as POST /api/integrations/whatsapp/webhook
 */

// GET — Webhook verification by Meta
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'specteros_webhook_token_2026';

  if (mode === 'subscribe' && (token === expectedToken || token === 'specteros_webhook_token_2026' || token === 'nexaflow_webhook_token_2026')) {
    console.log('[WhatsApp Webhook] Verification successful for Meta challenge');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[WhatsApp Webhook] Verification token mismatch. Expected:', expectedToken, 'Received:', token);
  return new Response('Verification token mismatch', { status: 403 });
}

// POST — Incoming messages from Meta WhatsApp Cloud API
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Signature verification if WHATSAPP_APP_SECRET is configured
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = request.headers.get('x-hub-signature-256') ?? '';
    const expectedSig = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    if (!signature || signature !== expectedSig) {
      console.warn('[WhatsApp Webhook] Invalid HMAC signature');
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Ensure messages table exists in SQLite
  await execute(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      project_id TEXT,
      user_id TEXT NOT NULL,
      phone_number TEXT,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT DEFAULT 'delivered',
      created_at TEXT NOT NULL
    )
  `);

  const entries = body.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const val = change.value;
      const messages = val?.messages || [];

      for (const msg of messages) {
        const fromNumber = msg.from;
        const msgId = msg.id;
        const textContent = msg.text?.body || msg.type || '';
        const now = new Date().toISOString();

        if (!textContent) continue;

        // Idempotency check in SQLite
        const existing = await queryOne<any>('SELECT id FROM whatsapp_messages WHERE id = ?', [msgId]);
        if (existing) continue;

        // Save incoming user message in SQLite
        await execute(
          `INSERT INTO whatsapp_messages (id, organization_id, user_id, phone_number, sender, body, status, created_at)
           VALUES (?, 'org_default', 'usr_whatsapp_incoming', ?, 'user', ?, 'delivered', ?)`,
          [msgId, fromNumber, textContent, now]
        );

        // Generate intelligent automated bot reply
        const replyText = await generateWhatsAppBotReply(textContent);

        // Dispatch reply back via Meta Cloud API / WhatsApp Engine
        await sendWhatsAppMessage({
          to: fromNumber,
          message: replyText,
          sender: 'bot',
          userId: 'usr_whatsapp_bot',
        });
      }
    }
  }

  return NextResponse.json({ status: 'success' }, { status: 200 });
}
