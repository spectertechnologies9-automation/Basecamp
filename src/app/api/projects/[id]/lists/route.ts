import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// POST /api/projects/:id/lists — create a new todo list
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json<ApiResponse>({ error: 'List name is required' }, { status: 400 });
  }

  const listId = `lst_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  await execute(
    'INSERT INTO todo_lists (id, project_id, name, position, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [listId, params.id, body.name.trim(), body.position || 0, user.id, now]
  );

  const newList = await queryOne('SELECT * FROM todo_lists WHERE id = ?', [listId]);

  return NextResponse.json<ApiResponse>({ data: newList }, { status: 201 });
}
