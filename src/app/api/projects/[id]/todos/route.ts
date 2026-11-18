import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

interface Ctx {
  params: { id: string };
}

// GET /api/projects/:id/todos — list todo lists with nested todos
export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  // 1. Check user role in project
  const member = await queryOne<any>(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [params.id, user.id]
  );

  const isClient = user.role === 'client' || member?.role === 'client';
  if (isClient) {
    // Client cannot see the to-do list at all
    return NextResponse.json<ApiResponse>({ data: [] } as any);
  }

  const isGlobalAdmin = user.role === 'admin' || user.role === 'owner';
  const isLead =
    isGlobalAdmin ||
    (member?.role as string) === 'lead' ||
    (member?.role as string) === 'team_lead' ||
    (member?.role as string) === 'owner' ||
    user.role === 'project_manager' ||
    (user.role as string) === 'brand_manager';

  let todos: any[] = [];
  if (isLead) {
    // Admin and Team Lead can see all tasks in this project
    todos = await query<any>(
      `SELECT t.*, u.full_name as assignee_name, u.avatar_url as assignee_avatar, p.name as project_name
       FROM todos t
       LEFT JOIN users u ON u.id = COALESCE(t.assignee_id, json_extract(t.assignee_ids, '$[0]'))
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.project_id = ?
       ORDER BY t.position ASC, t.created_at DESC`,
      [params.id]
    );
  } else {
    // Regular members can ONLY see tasks assigned to them
    todos = await query<any>(
      `SELECT t.*, u.full_name as assignee_name, u.avatar_url as assignee_avatar, p.name as project_name
       FROM todos t
       LEFT JOIN users u ON u.id = COALESCE(t.assignee_id, json_extract(t.assignee_ids, '$[0]'))
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.project_id = ?
         AND (
           t.assignee_id = ?
           OR t.assignee_ids LIKE ?
         )
       ORDER BY t.position ASC, t.created_at DESC`,
      [params.id, user.id, `%"${user.id}"%`]
    );
  }

  const userRows = await query<any>('SELECT id, full_name, email FROM users');
  const userMap = new Map<string, string>();
  userRows.forEach((u) => userMap.set(u.id, u.full_name || u.email));

  const formattedTodos = todos.map((t) => {
    let ids: string[] = [];
    try {
      if (t.assignee_ids) {
        ids = typeof t.assignee_ids === 'string' ? JSON.parse(t.assignee_ids) : t.assignee_ids;
      } else if (t.assignee_id) {
        ids = [t.assignee_id];
      }
    } catch {
      ids = t.assignee_id ? [t.assignee_id] : [];
    }

    const names = ids.map((id) => userMap.get(id)).filter(Boolean) as string[];
    const assigneeDisplay = names.length > 0 ? names.join(', ') : t.assignee_name || null;

    return {
      ...t,
      assignee_ids: ids,
      assignee_name: assigneeDisplay || t.assignee_name,
      assignee_names: assigneeDisplay,
    };
  });

  return NextResponse.json<ApiResponse>({ data: formattedTodos } as any);
}

// POST /api/projects/:id/todos — create a todo
export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  // Verify only admin or team lead can create tasks
  const member = await queryOne<any>(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [params.id, user.id]
  );
  const isLeadOrAdmin =
    user.role === 'admin' ||
    user.role === 'owner' ||
    user.role === 'project_manager' ||
    (user.role as string) === 'brand_manager' ||
    (member?.role as string) === 'lead' ||
    (member?.role as string) === 'team_lead' ||
    (member?.role as string) === 'owner';

  if (!isLeadOrAdmin) {
    return NextResponse.json<ApiResponse>({ error: 'Only administrators and team leads can create tasks' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json<ApiResponse>({ error: 'Todo title is required' }, { status: 400 });
  }

  let listId = body.todo_list_id;

  // If no list specified, use or create default list
  if (!listId) {
    let defaultList = await queryOne<any>(
      'SELECT id FROM todo_lists WHERE project_id = ? ORDER BY position ASC LIMIT 1',
      [params.id]
    );

    if (!defaultList) {
      listId = `lst_${crypto.randomBytes(8).toString('hex')}`;
      await execute(
        'INSERT INTO todo_lists (id, project_id, name, position, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [listId, params.id, 'To-dos', 0, user.id, new Date().toISOString()]
      );
    } else {
      listId = defaultList.id;
    }
  }

  const todoId = `tdo_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  const assigneeIds = Array.isArray(body.assignee_ids)
    ? body.assignee_ids
    : body.assignee_id
    ? [body.assignee_id]
    : [];
  const primaryAssigneeId = assigneeIds.length > 0 ? assigneeIds[0] : null;

  await execute(
    `INSERT INTO todos (
      id, todo_list_id, project_id, title, description, status, priority,
      assignee_ids, assignee_id, due_date, start_date, position, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      todoId,
      listId,
      params.id,
      body.title.trim(),
      body.description?.trim() || null,
      'open',
      body.priority || 'medium',
      JSON.stringify(assigneeIds),
      primaryAssigneeId,
      body.due_date || null,
      body.start_date || null,
      body.position || 0,
      user.id,
      now,
      now,
    ]
  );

  const newTodo = await queryOne<any>(
    `SELECT t.*, u.full_name as assignee_name, u.avatar_url as assignee_avatar
     FROM todos t
     LEFT JOIN users u ON u.id = COALESCE(t.assignee_id, json_extract(t.assignee_ids, '$[0]'))
     WHERE t.id = ?`,
    [todoId]
  );

  return NextResponse.json<ApiResponse>(
    {
      data: {
        ...newTodo,
        assignee_ids: newTodo?.assignee_ids ? JSON.parse(newTodo.assignee_ids) : [],
      },
    },
    { status: 201 }
  );
}
