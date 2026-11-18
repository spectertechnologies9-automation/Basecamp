import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { queryOne, query, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/projects/:id — single project detail
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const project = await queryOne<any>('SELECT * FROM projects WHERE id = ?', [params.id]);
  if (!project) return NextResponse.json<ApiResponse>({ error: 'Not found' }, { status: 404 });

  const members = await query<any>(
    `SELECT pm.*, u.full_name, u.avatar_url, u.email
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ?`,
    [params.id]
  );

  return NextResponse.json<ApiResponse>({
    data: {
      ...project,
      settings: project.settings ? JSON.parse(project.settings) : {},
      members,
    },
  });
}

// PATCH /api/projects/:id — update project
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const allowed = ['name', 'description', 'color', 'status', 'visibility', 'start_date', 'end_date'];
    const updates: string[] = [];
    const values: any[] = [];

    for (const key of allowed) {
      if (key in body && body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(body[key]);
      }
    }

    if (body.settings) {
      updates.push('settings = ?');
      values.push(typeof body.settings === 'string' ? body.settings : JSON.stringify(body.settings));
    }

    if (updates.length > 0) {
      const now = new Date().toISOString();
      updates.push('updated_at = ?');
      values.push(now);
      values.push(params.id);

      await execute(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const updated = await queryOne<any>('SELECT * FROM projects WHERE id = ?', [params.id]);
    return NextResponse.json<ApiResponse>({ data: updated, message: 'Project updated' });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/:id — delete project (Admin only)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'admin' && user.role !== 'owner') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only administrators can delete projects' },
      { status: 403 }
    );
  }

  await execute('DELETE FROM projects WHERE id = ?', [params.id]);
  await execute('DELETE FROM project_members WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM comments WHERE todo_id IN (SELECT id FROM todos WHERE project_id = ?)', [params.id]);
  await execute('DELETE FROM todo_lists WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM todos WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM project_announcements WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM project_announcement_comments WHERE announcement_id IN (SELECT id FROM project_announcements WHERE project_id = ?)', [params.id]);
  await execute('DELETE FROM project_approvals WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM project_files WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM project_brand_data WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM chat_messages WHERE channel_id IN (SELECT id FROM chat_channels WHERE project_id = ?)', [params.id]);
  await execute('DELETE FROM chat_channels WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM message_posts WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM documents WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM calendar_events WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM notifications WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM time_entries WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM scheduled_posts WHERE project_id = ?', [params.id]);
  await execute('DELETE FROM file_approvals WHERE project_id = ?', [params.id]);

  return NextResponse.json<ApiResponse>({ message: 'Project deleted' });
}
