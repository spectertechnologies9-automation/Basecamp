import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { MyTasksView } from '@/components/personal/my-tasks-view';

export const metadata: Metadata = { title: 'My Tasks' };

export default async function MyTasksPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  // Personal workspace is gated strictly to Administrators and Owners
  if (user.role !== 'admin' && user.role !== 'owner') {
    redirect('/dashboard');
  }

  const rows = await query<any>(
    `SELECT t.*, p.name as project_name, p.color as project_color, l.name as list_name
     FROM todos t
     JOIN projects p ON p.id = t.project_id
     LEFT JOIN todo_lists l ON l.id = t.todo_list_id
     WHERE (t.created_by = ? OR t.assignee_ids LIKE ?)
       AND t.status != 'completed'
     ORDER BY t.due_date ASC, t.created_at DESC
     LIMIT 100`,
    [user.id, `%"${user.id}"%`]
  );

  const todos = rows.map((r) => ({
    ...r,
    assignee_ids: (() => {
      try {
        return r.assignee_ids ? JSON.parse(r.assignee_ids) : [];
      } catch {
        return [];
      }
    })(),
    project: {
      id: r.project_id,
      name: r.project_name,
      color: r.project_color,
    },
    todo_list: {
      id: r.todo_list_id,
      name: r.list_name,
    },
  }));

  return <MyTasksView todos={todos as any} currentUserId={user.id} />;
}
