import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; annId: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const comments = await query<any>(
    `SELECT * FROM project_announcement_comments
     WHERE announcement_id = ?
     ORDER BY created_at ASC`,
    [params.annId]
  );

  return NextResponse.json({ data: comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; annId: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const commentText = body.body || body.content;

    if (!commentText?.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    const id = `ac_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO project_announcement_comments (id, announcement_id, author_id, author_name, body, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, params.annId, user.id, user.full_name, commentText.trim(), now]
    );

    return NextResponse.json({
      data: {
        id,
        announcement_id: params.annId,
        author_id: user.id,
        author_name: user.full_name,
        body: commentText.trim(),
        created_at: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
