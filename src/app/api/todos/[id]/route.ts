import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { queryOne, query, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

interface Ctx {
  params: { id: string };
}

// GET /api/todos/:id
export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const todo = await queryOne<any>('SELECT * FROM todos WHERE id = ?', [params.id]);
  if (!todo) return NextResponse.json<ApiResponse>({ error: 'Not found' }, { status: 404 });

  const comments = await query<any>(
    `SELECT c.*, u.full_name as author_name, u.avatar_url as author_avatar
     FROM comments c
     JOIN users u ON u.id = c.author_id
     WHERE c.todo_id = ?
     ORDER BY c.created_at ASC`,
    [params.id]
  );

  return NextResponse.json<ApiResponse>({
    data: {
      ...todo,
      assignee_ids: todo.assignee_ids ? JSON.parse(todo.assignee_ids) : [],
      comments: comments || [],
    },
  });
}

// PATCH /api/todos/:id — update title, status, priority, or completion
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const todo = await queryOne<any>('SELECT * FROM todos WHERE id = ?', [params.id]);
  if (!todo) return NextResponse.json<ApiResponse>({ error: 'Not found' }, { status: 404 });

  const now = new Date().toISOString();
  let status = body.status !== undefined ? body.status : todo.status;
  let completed_at = todo.completed_at;
  let completed_by = todo.completed_by;

  if (body.status === 'completed' && todo.status !== 'completed') {
    completed_at = now;
    completed_by = user.id;
  } else if (body.status === 'open') {
    completed_at = null;
    completed_by = null;
  }

  const title = body.title !== undefined ? body.title : todo.title;
  const description = body.description !== undefined ? body.description : todo.description;
  const priority = body.priority !== undefined ? body.priority : todo.priority;
  const due_date = body.due_date !== undefined ? body.due_date : todo.due_date;
  const position = body.position !== undefined ? body.position : todo.position;
  const requested_status = body.requested_status !== undefined ? body.requested_status : todo.requested_status;
  const assignee_ids =
    body.assignee_ids !== undefined
      ? typeof body.assignee_ids === 'string'
        ? body.assignee_ids
        : JSON.stringify(body.assignee_ids)
      : todo.assignee_ids;

  try {
    try {
      await execute(
        `UPDATE todos SET
          title = ?, description = ?, status = ?, priority = ?, due_date = ?, position = ?, assignee_ids = ?,
          requested_status = ?, completed_at = ?, completed_by = ?, updated_at = ?
         WHERE id = ?`,
        [title, description, status, priority, due_date, position, assignee_ids, requested_status, completed_at, completed_by, now, params.id]
      );
    } catch {
      await execute(
        `UPDATE todos SET
          title = ?, description = ?, status = ?, priority = ?, due_date = ?, position = ?, assignee_ids = ?,
          completed_at = ?, completed_by = ?, updated_at = ?
         WHERE id = ?`,
        [title, description, status, priority, due_date, position, assignee_ids, completed_at, completed_by, now, params.id]
      );
    }

    const updated = await queryOne<any>('SELECT * FROM todos WHERE id = ?', [params.id]);

    return NextResponse.json<ApiResponse>({
      data: {
        ...updated,
        assignee_ids: updated.assignee_ids ? JSON.parse(updated.assignee_ids) : [],
      },
    });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to update todo' }, { status: 500 });
  }
}

// DELETE /api/todos/:id
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const todo = await queryOne<any>('SELECT * FROM todos WHERE id = ?', [params.id]);
  if (!todo) return NextResponse.json<ApiResponse>({ error: 'Not found' }, { status: 404 });

  const isGlobalAdmin = user.role === 'admin' || user.role === 'owner';
  const member = await queryOne<any>(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [todo.project_id, user.id]
  );
  const isLead = member?.role === 'lead' || member?.role === 'owner' || member?.role === 'team_lead' || member?.role === 'brand_manager';

  if (!isGlobalAdmin && !isLead && todo.created_by !== user.id) {
    return NextResponse.json<ApiResponse>({ error: 'Forbidden: Only Team Leads and Admins can delete tasks' }, { status: 403 });
  }

  await execute('DELETE FROM todos WHERE id = ?', [params.id]);
  return NextResponse.json<ApiResponse>({ message: 'Deleted' });
}
