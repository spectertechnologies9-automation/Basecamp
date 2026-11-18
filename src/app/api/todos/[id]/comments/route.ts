import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

interface Ctx { params: { id: string } }

// GET /api/todos/:id/comments — list comments on a todo
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('comments')
    .select('*, author:users(id, full_name, avatar_url)')
    .eq('todo_id', params.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json<ApiResponse>({ error: error.message }, { status: 500 });
  return NextResponse.json<ApiResponse>({ data });
}

// POST /api/todos/:id/comments — add a comment
export async function POST(req: NextRequest, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.body?.trim()) return NextResponse.json<ApiResponse>({ error: 'Comment body required' }, { status: 400 });

  // Verify todo exists (RLS enforces project membership)
  const { data: todo } = await supabase.from('todos').select('id, project_id, title').eq('id', params.id).single();
  if (!todo) return NextResponse.json<ApiResponse>({ error: 'Todo not found' }, { status: 404 });

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      todo_id: params.id,
      body: body.body.trim(),
      author_id: user.id,
      parent_id: body.parent_id ?? null,
    })
    .select('*, author:users(id, full_name, avatar_url)')
    .single();

  if (error || !comment) return NextResponse.json<ApiResponse>({ error: error?.message }, { status: 500 });

  // Audit log
  await supabase.from('audit_logs').insert({
    organization_id: null,
    actor_id: user.id,
    action: `commented on "${todo.title}"`,
    entity_type: 'comment',
    entity_id: comment.id,
  });

  return NextResponse.json<ApiResponse>({ data: comment }, { status: 201 });
}
