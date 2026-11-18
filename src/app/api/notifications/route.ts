import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/notifications
export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  await execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      action_url TEXT,
      actor_id TEXT,
      project_id TEXT,
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      created_at TEXT NOT NULL
    )
  `);

  const rows = await query<any>(
    `SELECT n.*, u.full_name as actor_name, u.avatar_url as actor_avatar, p.name as project_name
     FROM notifications n
     LEFT JOIN users u ON u.id = n.actor_id
     LEFT JOIN projects p ON p.id = n.project_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [user.id]
  );

  const notifications = rows.map((n) => ({
    id: n.id,
    user_id: n.user_id,
    type: n.type,
    title: n.title,
    body: n.body,
    action_url: n.action_url,
    is_read: Boolean(n.is_read),
    read_at: n.read_at,
    actor: n.actor_name ? { id: n.actor_id, full_name: n.actor_name, avatar_url: n.actor_avatar } : undefined,
    project: n.project_name ? { id: n.project_id, name: n.project_name } : undefined,
    created_at: n.created_at,
  }));

  return NextResponse.json<ApiResponse>({ data: notifications });
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date().toISOString();
  await execute('UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0', [now, user.id]);

  return NextResponse.json<ApiResponse>({ message: 'All notifications marked as read' });
}
