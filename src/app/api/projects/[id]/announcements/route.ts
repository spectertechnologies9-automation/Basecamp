import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const announcements = await query<any>(
    `SELECT a.*, 
            (SELECT COUNT(*) FROM project_announcement_comments c WHERE c.announcement_id = a.id) as comment_count
     FROM project_announcements a
     WHERE a.project_id = ?
     ORDER BY a.is_pinned DESC, a.created_at DESC`,
    [params.id]
  );

  return NextResponse.json({ data: announcements });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, body: content, category, is_pinned } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const id = `ann_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO project_announcements (
        id, project_id, title, body, author_id, author_name, category, is_pinned, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.id,
        title.trim(),
        content.trim(),
        user.id,
        user.full_name,
        category?.trim() || 'General',
        is_pinned ? 1 : 0,
        now,
        now,
      ]
    );

    // Audit log
    await execute(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, ?, 'announcement.create', 'project', ?, ?)`,
      [`audit_${crypto.randomBytes(8).toString('hex')}`, user.organization_id || 'org_default', user.id, params.id, now]
    );

    return NextResponse.json({
      data: {
        id,
        project_id: params.id,
        title: title.trim(),
        body: content.trim(),
        author_id: user.id,
        author_name: user.full_name,
        category: category?.trim() || 'General',
        is_pinned: is_pinned ? 1 : 0,
        comment_count: 0,
        created_at: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
