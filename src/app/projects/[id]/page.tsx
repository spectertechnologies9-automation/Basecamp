import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { ProjectDashboard } from '@/components/projects/project-dashboard';

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return [
    { id: '1' },
    { id: 'demo' },
  ];
}

const DEFAULT_CLEAN_PROJECT: any = {
  id: 'prj_default',
  name: 'Project Workspace',
  client_name: 'CLIENT',
  clientName: 'CLIENT',
  description: 'Collaborative workspace for deliverables, to-dos, and pipeline tracking.',
  status: 'active',
  category: 'general',
  end_date: '2026-12-31',
  dueDate: '2026-12-31',
  owner_id: 'usr_superadmin',
  organization_id: 'org_default',
  settings: {},
  members: [],
  todos: [],
  stats: { openTodos: 0, completedTodos: 0 },
  activity: [],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const project = await queryOne<any>('SELECT name FROM projects WHERE id = ?', [params.id]);
    return { title: project?.name ?? 'Project Workspace' };
  } catch {
    return { title: 'Project Workspace' };
  }
}

export default async function ProjectPage({ params }: Props) {
  const user = await getServerUser();
  if (!user) {
    redirect('/auth/login');
  }
  const fallback = { ...DEFAULT_CLEAN_PROJECT, id: params.id };

  try {
    const project = await queryOne<any>('SELECT * FROM projects WHERE id = ?', [params.id]);
    if (!project) {
      return (
        <ProjectDashboard
          project={fallback}
          currentUserId={user.id}
          stats={fallback.stats}
          todos={fallback.todos}
          activity={fallback.activity}
        />
      );
    }

    const memberRows = await query<any>(
      `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.created_at,
              u.full_name, u.avatar_url, u.role as user_role
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ?`,
      [params.id]
    );

    const openStats = await queryOne<{ count: number }>(
      "SELECT count(*) as count FROM todos WHERE project_id = ? AND status != 'completed'",
      [params.id]
    );
    const completedStats = await queryOne<{ count: number }>(
      "SELECT count(*) as count FROM todos WHERE project_id = ? AND status = 'completed'",
      [params.id]
    );

    const formattedProject = {
      ...project,
      settings: project.settings ? JSON.parse(project.settings) : {},
      members: (memberRows || []).map((m: any) => ({
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
        stats={{
          openTodos: openStats?.count ?? fallback.stats.openTodos,
          completedTodos: completedStats?.count ?? fallback.stats.completedTodos,
        }}
        todos={fallback.todos}
        activity={fallback.activity}
      />
    );
  } catch {
    return (
      <ProjectDashboard
        project={fallback}
        currentUserId={user.id}
        stats={fallback.stats}
        todos={fallback.todos}
        activity={fallback.activity}
      />
    );
  }
}
