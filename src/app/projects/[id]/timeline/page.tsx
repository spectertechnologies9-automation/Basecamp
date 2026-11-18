import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { TimelineView } from '@/components/timeline/timeline-view';

export const metadata: Metadata = { title: 'Timeline' };

export default async function TimelinePage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const project = await queryOne<any>('SELECT id, name, color FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  const todos = await query<any>(
    'SELECT * FROM todos WHERE project_id = ? ORDER BY due_date ASC, created_at ASC',
    [params.id]
  );

  return <TimelineView project={project} todos={todos} />;
}
