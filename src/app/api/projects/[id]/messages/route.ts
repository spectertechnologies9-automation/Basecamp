import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/projects/:id/messages
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<any>(
    `SELECT m.*, u.full_name as author_name, u.avatar_url as author_avatar
     FROM message_posts m
     LEFT JOIN users u ON u.id = m.author_id
     WHERE m.project_id = ?
     ORDER BY m.is_pinned DESC, m.created_at DESC`,
    [params.id]
  );

  const posts = rows.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    title: r.title,
    body: r.body,
    author_id: r.author_id,
    is_pinned: Boolean(r.is_pinned),
    created_at: r.created_at,
    author: {
      id: r.author_id,
      full_name: r.author_name || 'Team Member',
      avatar_url: r.author_avatar,
    },
  }));

  return NextResponse.json<ApiResponse>({ data: posts });
}

// POST /api/projects/:id/messages
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const title = body.title?.trim();
    const content = body.body?.trim() || '';

    if (!title) {
      return NextResponse.json<ApiResponse>({ error: 'Title is required' }, { status: 400 });
    }

    const postId = `pst_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    await execute(
      'INSERT INTO message_posts (id, project_id, title, body, author_id, is_pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
      [postId, params.id, title, content, user.id, now, now]
    );

    // Audit log
    await execute(
      'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`aud_${crypto.randomBytes(8).toString('hex')}`, user.organization_id || 'org_default', user.id, 'posted a message', 'message_post', postId, now]
    );

    const post = {
      id: postId,
      project_id: params.id,
      title,
      body: content,
      author_id: user.id,
      is_pinned: false,
      created_at: now,
      author: {
        id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
    };

    return NextResponse.json<ApiResponse>({ data: post, message: 'Message posted' });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to post message' }, { status: 500 });
  }
}
