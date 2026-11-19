import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { TodosView } from '@/components/todos/todos-view';

interface Props {
  params: { id: string };
}

export const metadata: Metadata = { title: 'To-do Lists' };

export default async function ProjectTodosPage({ params }: Props) {
  const user = await getServerUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Verify membership (Admins and Super Admins automatically have project access)
  let member = await queryOne<any>(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [params.id, user.id]
  );
  if (!member && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'owner')) {
    member = { role: 'admin' };
  }
  if (!member) notFound();

  // Fetch project
  const project = await queryOne<any>(
    'SELECT id, name, color FROM projects WHERE id = ?',
    [params.id]
  );
  if (!project) notFound();

  // Fetch lists
  const lists = await query<any>(
    'SELECT * FROM todo_lists WHERE project_id = ? ORDER BY position ASC',
    [params.id]
  );

  // Fetch todos for each list
  const todoListsWithTodos = await Promise.all(
    lists.map(async (list) => {
      const todos = await query<any>(
        'SELECT * FROM todos WHERE todo_list_id = ? ORDER BY position ASC, created_at ASC',
        [list.id]
      );
      return {
        ...list,
        todos: todos.map((t) => ({
          ...t,
          assignee_ids: t.assignee_ids ? JSON.parse(t.assignee_ids) : [],
        })),
      };
    })
  );

  // Fetch project members for assignee selection
  const memberUsers = await query<any>(
    `SELECT u.id, u.full_name, u.avatar_url
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ?`,
    [params.id]
  );

  return (
    <TodosView
      project={project}
      todoLists={todoListsWithTodos as any}
      members={memberUsers as any}
      currentUserId={user.id}
      userRole={member.role as any}
    />
  );
}
