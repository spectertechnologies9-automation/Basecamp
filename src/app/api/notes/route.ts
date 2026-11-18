import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notes = await query<any>(
    'SELECT * FROM personal_notes WHERE user_id = ? ORDER BY updated_at DESC',
    [user.id]
  );

  return NextResponse.json({ data: notes });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content } = body;

    if (!content && !title) {
      return NextResponse.json({ error: 'Note title or content is required' }, { status: 400 });
    }

    const noteId = `not_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO personal_notes (id, user_id, title, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [noteId, user.id, title?.trim() || 'Untitled Note', content?.trim() || '', now, now]
    );

    return NextResponse.json({
      data: {
        id: noteId,
        user_id: user.id,
        title: title?.trim() || 'Untitled Note',
        content: content?.trim() || '',
        created_at: now,
        updated_at: now,
      },
      message: 'Note saved',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save note' }, { status: 500 });
  }
}
