import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { CardTableView } from '@/components/board/card-table-view';

export const metadata: Metadata = { title: 'Card Table (Kanban)' };

export default async function BoardPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const project = await queryOne<any>('SELECT id, name, color FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  const cards = await query<any>(
    'SELECT * FROM todos WHERE project_id = ? ORDER BY position ASC, created_at DESC',
    [params.id]
  );

  return (
    <CardTableView
      project={project}
      initialCards={cards}
      currentUserId={user.id}
    />
  );
}
