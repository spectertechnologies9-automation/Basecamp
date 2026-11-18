import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { ProjectSettingsView } from '@/components/projects/project-settings-view';

export const metadata: Metadata = { title: 'Project Settings' };

export default async function ProjectSettingsPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const project = await queryOne<any>('SELECT * FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  const member = await queryOne<any>(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [params.id, user.id]
  );

  const canEdit = member && ['owner', 'admin', 'project_manager'].includes(member.role);

  return (
    <ProjectSettingsView
      project={project}
      canEdit={Boolean(canEdit)}
      currentUserId={user.id}
    />
  );
}
