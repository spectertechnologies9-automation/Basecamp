import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { sendWhatsAppMessage, generateWhatsAppBotReply, getWhatsAppConfigStatus } from '@/lib/whatsapp';
import type { ApiResponse } from '@/types';

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');

  // Ensure table exists
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

  let messages: any[] = [];
  if (projectId) {
    messages = await query<any>(
      'SELECT * FROM whatsapp_messages WHERE project_id = ? OR user_id = ? ORDER BY created_at ASC LIMIT 100',
      [projectId, user.id]
    );
  } else {
    messages = await query<any>(
      'SELECT * FROM whatsapp_messages WHERE user_id = ? OR organization_id = ? ORDER BY created_at ASC LIMIT 100',
      [user.id, user.organization_id || 'org_default']
    );
  }

  return NextResponse.json<ApiResponse>({
    data: messages,
    message: 'Success',
    ...({ config: getWhatsAppConfigStatus() } as any),
  });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const text = body.message?.trim();
    const phone = body.phone?.trim() || '+1 (555) 019-2834';
    const projectId = body.project_id || null;
    const orgId = user.organization_id || 'org_default';

    if (!text) {
      return NextResponse.json<ApiResponse>({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // 1. Dispatch User Message
    const userDispatch = await sendWhatsAppMessage({
      to: phone,
      message: text,
      organizationId: orgId,
      projectId,
      userId: user.id,
      sender: 'user',
    });

    const now = new Date().toISOString();
    const userMessage = {
      id: userDispatch.messageId,
      user_id: user.id,
      phone_number: phone,
      sender: 'user',
      body: text,
      status: 'delivered',
      created_at: now,
    };

    // 2. Generate Intelligent Bot Reply
    const botReplyText = await generateWhatsAppBotReply(text);

    // 3. Dispatch Bot Message back
    const botDispatch = await sendWhatsAppMessage({
      to: phone,
      message: botReplyText,
      organizationId: orgId,
      projectId,
      userId: user.id,
      sender: 'bot',
    });

    const botTime = new Date(Date.now() + 800).toISOString();
    const botReply = {
      id: botDispatch.messageId,
      user_id: user.id,
      phone_number: phone,
      sender: 'bot',
      body: botReplyText,
      status: 'delivered',
      created_at: botTime,
    };

    return NextResponse.json<ApiResponse>({
      data: {
        userMessage,
        botReply,
        provider: userDispatch.provider,
      },
    });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'WhatsApp message dispatch failed' }, { status: 500 });
  }
}
