import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { ProjectDashboard } from '@/components/projects/project-dashboard';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await queryOne<any>('SELECT name FROM projects WHERE id = ?', [params.id]);
  return { title: `Client Chat - ${project?.name ?? 'Project'}` };
}

export default async function ClientChatPage({ params }: Props) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const project = await queryOne<any>('SELECT * FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  const memberRows = await query<any>(
    `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.created_at,
            u.full_name, u.avatar_url, u.role as user_role
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ?`,
    [params.id]
  );

  const formattedProject = {
    ...project,
    settings: project.settings ? JSON.parse(project.settings) : {},
    members: memberRows.map((m) => ({
      id: m.id,
      project_id: m.project_id,
      user_id: m.user_id,
      role: m.role,
      user: {
        id: m.user_id,
        full_name: m.full_name,
        avatar_url: m.avatar_url,
        role: m.user_role,
      },
    })),
  };

  return (
    <ProjectDashboard
      project={formattedProject as any}
      currentUserId={user.id}
      stats={{ openTodos: 0, completedTodos: 0 }}
      activity={[]}
      initialTool="client-chat"
    />
  );
}
