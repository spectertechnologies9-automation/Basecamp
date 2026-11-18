import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/projects — list user's projects
export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = user.role === 'admin' || user.role === 'owner';
  const projectRows = isAdmin
    ? await query<any>(
        "SELECT * FROM projects WHERE status != 'archived' AND status != 'deleted' ORDER BY created_at DESC"
      )
    : await query<any>(
        `SELECT DISTINCT p.* FROM projects p
         LEFT JOIN project_members pm ON pm.project_id = p.id
         WHERE (pm.user_id = ? OR p.owner_id = ?)
           AND p.status != 'archived' AND p.status != 'deleted'
         ORDER BY p.created_at DESC`,
        [user.id, user.id]
      );

  return NextResponse.json<ApiResponse>({ data: projectRows });
}

// POST /api/projects — create a project
export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only Admin or Owner can create a new project
  if (user.role !== 'admin' && user.role !== 'owner') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only administrators can create projects' },
      { status: 403 }
    );
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json<ApiResponse>({ error: 'Project name is required' }, { status: 400 });
  }

  const projectId = `prj_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();
  const orgId = user.organization_id || 'org_default';

  await execute(
    `INSERT INTO projects (
      id, organization_id, owner_id, name, description, color, status, visibility, start_date, end_date, settings, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectId,
      orgId,
      user.id,
      body.name.trim(),
      body.description?.trim() || null,
      body.color || '#39C6AE',
      body.status || 'active',
      body.visibility || 'organization',
      body.start_date || null,
      body.end_date || null,
      JSON.stringify(body.settings || { tools: { todos: true, campfire: true, message_board: true } }),
      now,
      now,
    ]
  );

  // Add owner to project members
  await execute(
    'INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
    [`pm_${crypto.randomBytes(8).toString('hex')}`, projectId, user.id, 'owner', now]
  );

  // If a team lead is assigned during creation, add them with role 'lead'
  if (body.lead_id && body.lead_id !== user.id) {
    await execute(
      'INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [`pm_${crypto.randomBytes(8).toString('hex')}`, projectId, body.lead_id, 'lead', now]
    );
  }

  // If a client is assigned, add them with role 'client'
  if (body.client_id) {
    await execute(
      'INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [`pm_${crypto.randomBytes(8).toString('hex')}`, projectId, body.client_id, 'client', now]
    );
  }

  // Create default Campfire chat channel
  await execute(
    'INSERT INTO chat_channels (id, project_id, name, type, created_at) VALUES (?, ?, ?, ?, ?)',
    [`ch_${crypto.randomBytes(8).toString('hex')}`, projectId, 'Campfire', 'campfire', now]
  );

  // Create default Todo list
  await execute(
    'INSERT INTO todo_lists (id, project_id, name, position, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [`lst_${crypto.randomBytes(8).toString('hex')}`, projectId, 'To-dos', 0, user.id, now]
  );

  // Log audit event
  await execute(
    'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [`aud_${crypto.randomBytes(8).toString('hex')}`, orgId, user.id, `created project "${body.name.trim()}"`, 'project', projectId, now]
  );

  return NextResponse.json<ApiResponse>(
    { data: { id: projectId, name: body.name.trim() }, message: 'Project created' },
    { status: 201 }
  );
}
