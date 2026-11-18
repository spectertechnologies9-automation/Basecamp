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
  return { title: project?.name ?? 'Project' };
}

export default async function ProjectPage({ params }: Props) {
  const user = await getServerUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Fetch project
  const project = await queryOne<any>('SELECT * FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  // Fetch project members
  const memberRows = await query<any>(
    `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.created_at,
            u.full_name, u.avatar_url, u.role as user_role
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ?`,
    [params.id]
  );

  const isAdmin = user.role === 'admin' || user.role === 'owner';
  const isMember = memberRows.some((m) => m.user_id === user.id);
  if (!isMember && !isAdmin && project.owner_id !== user.id) {
    notFound();
  }

  // Fetch todo statistics
  const openStats = await queryOne<{ count: number }>(
    "SELECT count(*) as count FROM todos WHERE project_id = ? AND status != 'completed'",
    [params.id]
  );
  const completedStats = await queryOne<{ count: number }>(
    "SELECT count(*) as count FROM todos WHERE project_id = ? AND status = 'completed'",
    [params.id]
  );

  // Fetch recent activity
  const activityRows = await query<any>(
    `SELECT a.*, u.full_name as actor_name, u.avatar_url as actor_avatar
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     WHERE a.entity_id = ?
     ORDER BY a.created_at DESC
     LIMIT 10`,
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

  const formattedActivity = activityRows.map((a) => ({
    id: a.id,
    organization_id: a.organization_id,
    actor_id: a.actor_id,
    action: a.action,
    entity_type: a.entity_type,
    entity_id: a.entity_id,
    actor: {
      id: a.actor_id,
      full_name: a.actor_name || 'Team member',
      avatar_url: a.actor_avatar,
    },
    created_at: a.created_at,
  }));

  // Fetch top todos for preview strictly scoped by role
  const currentUserRole = memberRows.find((m) => m.user_id === user.id)?.role || user.role;
  const isClientRole = currentUserRole === 'client';
  const isLeadOrAdminRole =
    isAdmin ||
    currentUserRole === 'lead' ||
    currentUserRole === 'team_lead' ||
    currentUserRole === 'brand_manager';

  let todoRows: any[] = [];
  if (!isClientRole) {
    if (isLeadOrAdminRole) {
      todoRows = await query<any>(
        `SELECT t.id, t.title, t.status, t.assignee_ids, t.assignee_id, u.full_name as assignee_name
         FROM todos t
         LEFT JOIN users u ON u.id = COALESCE(t.assignee_id, json_extract(t.assignee_ids, '$[0]'))
         WHERE t.project_id = ?
         ORDER BY t.created_at DESC LIMIT 5`,
        [params.id]
      );
    } else {
      todoRows = await query<any>(
        `SELECT t.id, t.title, t.status, t.assignee_ids, t.assignee_id, u.full_name as assignee_name
         FROM todos t
         LEFT JOIN users u ON u.id = COALESCE(t.assignee_id, json_extract(t.assignee_ids, '$[0]'))
         WHERE t.project_id = ?
           AND (
             t.assignee_id = ?
             OR t.assignee_ids LIKE ?
           )
         ORDER BY t.created_at DESC LIMIT 5`,
        [params.id, user.id, `%"${user.id}"%`]
      );
    }
  }

  return (
    <ProjectDashboard
      project={formattedProject as any}
      currentUserId={user.id}
      stats={{
        openTodos: openStats?.count ?? 0,
        completedTodos: completedStats?.count ?? 0,
      }}
      todos={todoRows}
      activity={formattedActivity as any}
    />
  );
}
