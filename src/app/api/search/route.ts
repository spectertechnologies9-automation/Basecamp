import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q) {
    return NextResponse.json({ data: { projects: [], todos: [], announcements: [], files: [] } });
  }

  const isAdmin = user.role === 'admin' || user.role === 'owner';
  const likeQ = `%${q}%`;

  const projects = isAdmin
    ? await query<any>(
        "SELECT id, name, description, color FROM projects WHERE (name LIKE ? OR description LIKE ?) AND status != 'archived' AND status != 'deleted' LIMIT 8",
        [likeQ, likeQ]
      )
    : await query<any>(
        `SELECT DISTINCT p.id, p.name, p.description, p.color
         FROM projects p
         LEFT JOIN project_members pm ON pm.project_id = p.id
         WHERE (pm.user_id = ? OR p.owner_id = ?)
           AND (p.name LIKE ? OR p.description LIKE ?)
           AND p.status != 'archived' AND p.status != 'deleted'
         LIMIT 8`,
        [user.id, user.id, likeQ, likeQ]
      );

  const todos = isAdmin
    ? await query<any>(
        `SELECT t.id, t.title, t.status, t.due_date, t.project_id, p.name as project_name
         FROM todos t
         JOIN projects p ON p.id = t.project_id
         WHERE t.title LIKE ? OR t.description LIKE ?
         LIMIT 10`,
        [likeQ, likeQ]
      )
    : await query<any>(
        `SELECT t.id, t.title, t.status, t.due_date, t.project_id, p.name as project_name
         FROM todos t
         JOIN projects p ON p.id = t.project_id
         LEFT JOIN project_members pm ON pm.project_id = p.id
         WHERE (pm.user_id = ? OR t.created_by = ?)
           AND (t.title LIKE ? OR t.description LIKE ?)
         LIMIT 10`,
        [user.id, user.id, likeQ, likeQ]
      );

  const announcements = isAdmin
    ? await query<any>(
        `SELECT a.id, a.title, a.category, a.project_id, p.name as project_name
         FROM project_announcements a
         JOIN projects p ON p.id = a.project_id
         WHERE a.title LIKE ? OR a.body LIKE ?
         LIMIT 8`,
        [likeQ, likeQ]
      )
    : await query<any>(
        `SELECT a.id, a.title, a.category, a.project_id, p.name as project_name
         FROM project_announcements a
         JOIN projects p ON p.id = a.project_id
         LEFT JOIN project_members pm ON pm.project_id = p.id
         WHERE (pm.user_id = ? OR a.author_id = ?)
           AND (a.title LIKE ? OR a.body LIKE ?)
         LIMIT 8`,
        [user.id, user.id, likeQ, likeQ]
      );

  const files = isAdmin
    ? await query<any>(
        `SELECT f.id, f.name, f.file_path, f.category, f.project_id, p.name as project_name
         FROM project_files f
         JOIN projects p ON p.id = f.project_id
         WHERE f.name LIKE ?
         LIMIT 8`,
        [likeQ]
      )
    : await query<any>(
        `SELECT f.id, f.name, f.file_path, f.category, f.project_id, p.name as project_name
         FROM project_files f
         JOIN projects p ON p.id = f.project_id
         LEFT JOIN project_members pm ON pm.project_id = p.id
         WHERE (pm.user_id = ? OR f.uploaded_by = ?)
           AND f.name LIKE ?
         LIMIT 8`,
        [user.id, user.id, likeQ]
      );

  const members = await query<any>(
    'SELECT id, full_name, email, role, avatar_url, bio FROM users WHERE (full_name LIKE ? OR email LIKE ?) AND is_active = 1 LIMIT 8',
    [likeQ, likeQ]
  );

  return NextResponse.json({
    data: {
      projects,
      todos,
      announcements,
      files,
      members,
    },
  });
}
