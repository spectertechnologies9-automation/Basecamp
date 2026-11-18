import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { HillChartView } from '@/components/hill/hill-chart-view';

export const metadata: Metadata = { title: 'Hill Chart' };

export default async function HillPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const project = await queryOne<any>('SELECT id, name, color FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  const todos = await query<any>(
    'SELECT * FROM todos WHERE project_id = ? ORDER BY created_at ASC',
    [params.id]
  );

  return <HillChartView project={project} todos={todos} />;
}
