import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');

  const isAdmin = user.role === 'admin' || user.role === 'owner';
  let events: any[] = [];

  if (isAdmin) {
    if (projectId) {
      events = await query<any>(
        'SELECT * FROM calendar_events WHERE project_id = ? ORDER BY start_at ASC',
        [projectId]
      );
    } else {
      events = await query<any>('SELECT * FROM calendar_events ORDER BY start_at ASC');
    }
  } else {
    if (projectId) {
      // Check if user is a member of this project or client
      events = await query<any>(
        `SELECT ce.* FROM calendar_events ce
         WHERE ce.project_id = ?
           AND (
             ce.created_by = ?
             OR ce.participant_ids LIKE ?
             OR ce.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
           )
         ORDER BY ce.start_at ASC`,
        [projectId, user.id, `%"${user.id}"%`, user.id]
      );
    } else {
      events = await query<any>(
        `SELECT ce.* FROM calendar_events ce
         WHERE ce.created_by = ?
            OR ce.participant_ids LIKE ?
            OR ce.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
         ORDER BY ce.start_at ASC`,
        [user.id, `%"${user.id}"%`, user.id]
      );
    }
  }

  return NextResponse.json({ data: events });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, start_at, end_at, is_all_day, project_id, create_task } = body;

    if (!title || !start_at) {
      return NextResponse.json({ error: 'Title and start time are required' }, { status: 400 });
    }

    const eventId = `ev_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();
    const orgId = user.organization_id || 'org_default';

    // Collect participants: current user plus project members if linked to a project
    let participants = [user.id];
    if (project_id) {
      const pMembers = await query<any>(
        'SELECT user_id FROM project_members WHERE project_id = ?',
        [project_id]
      );
      participants = Array.from(new Set([user.id, ...pMembers.map((m) => m.user_id)]));
    }

    await execute(
      `INSERT INTO calendar_events (
        id, organization_id, project_id, title, description, start_at, end_at, is_all_day, participant_ids, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        orgId,
        project_id || null,
        title.trim(),
        description?.trim() || null,
        start_at,
        end_at || start_at,
        is_all_day ? 1 : 0,
        JSON.stringify(participants),
        user.id,
        now,
      ]
    );

    let createdTodoId: string | null = null;
    // If linked to a project and requested as a task/milestone, create todo
    if (project_id && create_task) {
      let list = await queryOne<any>('SELECT id FROM todo_lists WHERE project_id = ? LIMIT 1', [project_id]);
      let listId = list?.id;
      if (!listId) {
        listId = `list_${crypto.randomBytes(8).toString('hex')}`;
        await execute(
          'INSERT INTO todo_lists (id, project_id, name, created_by, created_at) VALUES (?, ?, ?, ?, ?)',
          [listId, project_id, 'General To-dos', user.id, now]
        );
      }
      const todoId = `todo_${crypto.randomBytes(8).toString('hex')}`;
      createdTodoId = todoId;
      const dueDate = start_at.slice(0, 10);
      await execute(
        `INSERT INTO todos (id, todo_list_id, project_id, title, description, status, priority, assignee_ids, due_date, start_date, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'open', 'medium', ?, ?, ?, ?, ?, ?)`,
        [todoId, listId, project_id, title.trim(), description?.trim() || null, JSON.stringify([user.id]), dueDate, dueDate, user.id, now, now]
      );
    }

    // Audit log
    await execute(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`aud_${crypto.randomBytes(8).toString('hex')}`, orgId, user.id, 'scheduled', 'calendar_event', eventId, now]
    );

    return NextResponse.json({
      data: {
        id: eventId,
        title,
        description,
        start_at,
        end_at,
        linked_task_id: createdTodoId,
      },
      message: 'Event scheduled',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create event' }, { status: 500 });
  }
}
