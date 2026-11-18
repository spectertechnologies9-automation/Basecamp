import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TodoDetailView } from '@/components/todos/todo-detail-view';

interface Props { params: { id: string; todoId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase.from('todos').select('title').eq('id', params.todoId).single();
  return { title: data?.title ?? 'Task detail' };
}

export default async function TodoDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: todo } = await supabase
    .from('todos')
    .select(`
      *,
      todo_list:todo_lists(id, name),
      subtodos:todos!parent_id(id, title, status, priority, assignee_ids),
      comments:comments(*, author:users(id, full_name, avatar_url))
    `)
    .eq('id', params.todoId)
    .eq('project_id', params.id)
    .single();

  if (!todo) notFound();

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, color, members:project_members(user:users(id, full_name, avatar_url))')
    .eq('id', params.id)
    .single();

  const members = ((project as any)?.members ?? []).map((m: any) => m.user).filter(Boolean);

  return (
    <TodoDetailView
      todo={todo as any}
      project={project as any}
      members={members}
      currentUserId={user!.id}
    />
  );
}
