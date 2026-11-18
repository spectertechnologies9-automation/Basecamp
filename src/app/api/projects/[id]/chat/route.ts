import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/projects/:id/chat — fetch chat messages for project's campfire or client chat
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedType = searchParams.get('type') === 'client' ? 'client' : 'campfire';
  const channelName = requestedType === 'client' ? 'Client Chat' : 'Campfire';

  let channel = await queryOne<any>(
    'SELECT id FROM chat_channels WHERE project_id = ? AND type = ?',
    [params.id, requestedType]
  );

  if (!channel) {
    const channelId = `chn_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();
    await execute(
      'INSERT INTO chat_channels (id, project_id, name, type, created_at) VALUES (?, ?, ?, ?, ?)',
      [channelId, params.id, channelName, requestedType, now]
    );
    channel = { id: channelId };
  }

  const rows = await query<any>(
    `SELECT m.*, u.full_name as author_name, u.avatar_url as author_avatar
     FROM chat_messages m
     LEFT JOIN users u ON u.id = m.author_id
     WHERE m.channel_id = ?
     ORDER BY m.created_at ASC
     LIMIT 100`,
    [channel.id]
  );

  const messages = rows.map((r) => ({
    id: r.id,
    channel_id: r.channel_id,
    author_id: r.author_id,
    body: r.body,
    type: r.type,
    created_at: r.created_at,
    author: {
      id: r.author_id,
      full_name: r.author_name || 'Team Member',
      avatar_url: r.author_avatar,
    },
  }));

  return NextResponse.json<ApiResponse>({
    data: {
      channelId: channel.id,
      messages,
    },
  });
}

// POST /api/projects/:id/chat — send a message
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const text = body.body?.trim();
    if (!text) {
      return NextResponse.json<ApiResponse>({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const requestedType = body.type === 'client' ? 'client' : 'campfire';
    const channelName = requestedType === 'client' ? 'Client Chat' : 'Campfire';

    let channelId = body.channel_id;
    if (!channelId) {
      let channel = await queryOne<any>(
        'SELECT id FROM chat_channels WHERE project_id = ? AND type = ?',
        [params.id, requestedType]
      );
      if (!channel) {
        channelId = `chn_${crypto.randomBytes(8).toString('hex')}`;
        const now = new Date().toISOString();
        await execute(
          'INSERT INTO chat_channels (id, project_id, name, type, created_at) VALUES (?, ?, ?, ?, ?)',
          [channelId, params.id, channelName, requestedType, now]
        );
      } else {
        channelId = channel.id;
      }
    }

    const messageId = `msg_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    await execute(
      'INSERT INTO chat_messages (id, channel_id, author_id, body, type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [messageId, channelId, user.id, text, 'text', now]
    );

    const message = {
      id: messageId,
      channel_id: channelId,
      author_id: user.id,
      body: text,
      type: 'text',
      created_at: now,
      author: {
        id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
    };

    return NextResponse.json<ApiResponse>({ data: message });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to send message' }, { status: 500 });
  }
}
