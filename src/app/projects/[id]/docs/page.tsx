import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { DocsView } from '@/components/docs/docs-view';

export const metadata: Metadata = { title: 'Docs & Files' };

export default async function DocsPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const project = await queryOne<any>('SELECT id, name, color FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  const docs = await query<any>(
    `SELECT d.*, u.full_name as author_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.author_id
     WHERE d.project_id = ?
     ORDER BY d.updated_at DESC`,
    [params.id]
  );

  return <DocsView project={project} initialDocs={docs} />;
}
