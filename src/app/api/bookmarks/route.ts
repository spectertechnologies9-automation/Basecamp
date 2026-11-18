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

  const bookmarks = await query<any>(
    'SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC',
    [user.id]
  );

  return NextResponse.json({ data: bookmarks });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, url, entity_type, entity_id } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    const bookmarkId = `bm_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO bookmarks (id, user_id, entity_type, entity_id, title, url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookmarkId, user.id, entity_type || 'link', entity_id || bookmarkId, title.trim(), url.trim(), now]
    );

    return NextResponse.json({
      data: {
        id: bookmarkId,
        user_id: user.id,
        entity_type: entity_type || 'link',
        entity_id: entity_id || bookmarkId,
        title: title.trim(),
        url: url.trim(),
        created_at: now,
      },
      message: 'Bookmark saved',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save bookmark' }, { status: 500 });
  }
}
