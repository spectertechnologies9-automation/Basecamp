import type { Metadata } from 'next';
import { getServerUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { ProjectDashboard } from '@/components/projects/project-dashboard';

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return [
    { id: 'prj_2e2afb329d16ec4b' },
    { id: 'prj_2dc1a5bcddbd4de9' },
    { id: 'prj_horizon' },
    { id: 'prj_kallisto' },
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
  ];
}

const MOCK_PROJECTS_MAP: Record<string, any> = {
  prj_2e2afb329d16ec4b: {
    id: 'prj_2e2afb329d16ec4b',
    name: 'test',
    client_name: 'TEST',
    clientName: 'TEST',
    description: 'Internal testing workspace and design QA',
    status: 'active',
    category: 'general',
    end_date: '2026-11-30',
    dueDate: '2026-11-30',
    owner_id: 'usr_836f261323a28ad1',
    organization_id: 'org_default',
    settings: {},
    members: [
      { id: 'm1', project_id: 'prj_2e2afb329d16ec4b', user_id: 'usr_836f261323a28ad1', role: 'owner', user: { id: 'usr_836f261323a28ad1', full_name: 'Harikeshav', avatar_url: null, role: 'owner' } },
      { id: 'm2', project_id: 'prj_2e2afb329d16ec4b', user_id: 'usr_2', role: 'member', user: { id: 'usr_2', full_name: 'Alex Johnson', avatar_url: null, role: 'member' } },
    ],
    todos: [
      { id: 't3', title: 'Company-Wide Design Review (All Leads)', status: 'open', assignee_name: 'Harikeshav' },
      { id: 't9', title: 'need tyo finish branding', status: 'in_progress', assignee_name: 'Alex Johnson' },
      { id: 't13', title: 'work', status: 'in_review', assignee_name: 'Harikeshav' },
    ],
    stats: { openTodos: 2, completedTodos: 1 },
    activity: [
      { id: 'a1', action: 'todo.create', entity_type: 'todo', actor: { full_name: 'Harikeshav' }, created_at: '2026-11-18T10:00:00Z' },
    ],
  },
  prj_2dc1a5bcddbd4de9: {
    id: 'prj_2dc1a5bcddbd4de9',
    name: 'brand launch',
    client_name: 'BRAND LAUNCH',
    clientName: 'BRAND LAUNCH',
    description: 'Brand launch campaign, identity rollout, and merchandise',
    status: 'active',
    category: 'general',
    end_date: '2026-12-15',
    dueDate: '2026-12-15',
    owner_id: 'usr_836f261323a28ad1',
    organization_id: 'org_default',
    settings: {},
    members: [
      { id: 'm1', project_id: 'prj_2dc1a5bcddbd4de9', user_id: 'usr_836f261323a28ad1', role: 'owner', user: { id: 'usr_836f261323a28ad1', full_name: 'Harikeshav', avatar_url: null, role: 'owner' } },
      { id: 'm3', project_id: 'prj_2dc1a5bcddbd4de9', user_id: 'usr_3', role: 'lead', user: { id: 'usr_3', full_name: 'Sheeshram B.', avatar_url: null, role: 'lead' } },
    ],
    todos: [
      { id: 't2', title: 'works hard', status: 'open', assignee_name: 'Harikeshav' },
      { id: 't4', title: 'ok', status: 'open', assignee_name: 'Sheeshram B.' },
      { id: 't10', title: 'complete barn design', status: 'in_progress', assignee_name: 'Harikeshav' },
    ],
    stats: { openTodos: 3, completedTodos: 0 },
    activity: [
      { id: 'a2', action: 'project.update', entity_type: 'project', actor: { full_name: 'Sheeshram B.' }, created_at: '2026-11-18T09:30:00Z' },
    ],
  },
  prj_horizon: {
    id: 'prj_horizon',
    name: 'Editorial & Interactive Lookbook',
    client_name: 'HORIZON APPAREL',
    clientName: 'HORIZON APPAREL',
    description: 'High-fashion editorial site, lookbook and seasonal campaign',
    status: 'active',
    category: 'general',
    end_date: '2026-11-28',
    dueDate: '2026-11-28',
    owner_id: 'usr_836f261323a28ad1',
    organization_id: 'org_default',
    settings: {},
    members: [
      { id: 'm1', project_id: 'prj_horizon', user_id: 'usr_836f261323a28ad1', role: 'owner', user: { id: 'usr_836f261323a28ad1', full_name: 'Harikeshav', avatar_url: null, role: 'owner' } },
      { id: 'm4', project_id: 'prj_horizon', user_id: 'usr_4', role: 'member', user: { id: 'usr_4', full_name: 'Marcus Chen', avatar_url: null, role: 'member' } },
    ],
    todos: [
      { id: 't7', title: 'Implement smooth horizontal parallax layout', status: 'open', assignee_name: 'Marcus Chen' },
      { id: 't8', title: 'Finalize environmental sustainability metrics', status: 'open', assignee_name: 'Marcus Chen' },
      { id: 't12', title: 'Color grade 30-second campaign cut', status: 'in_progress', assignee_name: 'Harikeshav' },
      { id: 't16', title: 'Select top 45 hero stills from Iceland shoot', status: 'completed', assignee_name: 'Marcus Chen' },
    ],
    stats: { openTodos: 3, completedTodos: 1 },
    activity: [
      { id: 'a3', action: 'todo.complete', entity_type: 'todo', actor: { full_name: 'Marcus Chen' }, created_at: '2026-11-18T11:00:00Z' },
    ],
  },
  prj_kallisto: {
    id: 'prj_kallisto',
    name: 'Kallisto Sound Labs',
    client_name: 'KALLISTO SOUND LABS',
    clientName: 'KALLISTO SOUND LABS',
    description: 'Acoustic engineering branding, packaging and 3D product animations',
    status: 'active',
    category: 'general',
    end_date: '2026-12-05',
    dueDate: '2026-12-05',
    owner_id: 'usr_836f261323a28ad1',
    organization_id: 'org_default',
    settings: {},
    members: [
      { id: 'm1', project_id: 'prj_kallisto', user_id: 'usr_836f261323a28ad1', role: 'owner', user: { id: 'usr_836f261323a28ad1', full_name: 'Harikeshav', avatar_url: null, role: 'owner' } },
      { id: 'm5', project_id: 'prj_kallisto', user_id: 'usr_5', role: 'member', user: { id: 'usr_5', full_name: 'Design Lead', avatar_url: null, role: 'member' } },
    ],
    todos: [
      { id: 't1', title: 'coding backend', status: 'open', assignee_name: 'Harikeshav' },
      { id: 't5', title: 'Finalize tactile recycled linen exterior', status: 'open', assignee_name: 'Design Lead' },
      { id: 't6', title: 'Render 3D exploded assembly animation', status: 'open', assignee_name: 'Design Lead' },
      { id: 't11', title: 'Press check with Heidelberg print master', status: 'in_progress', assignee_name: 'Harikeshav' },
      { id: 't14', title: "Refine geometric 'K' monogram kerning", status: 'completed', assignee_name: 'Design Lead' },
      { id: 't15', title: 'Publish Pantone spot color swatches', status: 'completed', assignee_name: 'Design Lead' },
    ],
    stats: { openTodos: 4, completedTodos: 2 },
    activity: [
      { id: 'a4', action: 'todo.create', entity_type: 'todo', actor: { full_name: 'Design Lead' }, created_at: '2026-11-18T08:00:00Z' },
    ],
  },
};

// Aliases for 1, 2, 3, 4
MOCK_PROJECTS_MAP['1'] = MOCK_PROJECTS_MAP['prj_2e2afb329d16ec4b'];
MOCK_PROJECTS_MAP['2'] = MOCK_PROJECTS_MAP['prj_2dc1a5bcddbd4de9'];
MOCK_PROJECTS_MAP['3'] = MOCK_PROJECTS_MAP['prj_horizon'];
MOCK_PROJECTS_MAP['4'] = MOCK_PROJECTS_MAP['prj_kallisto'];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const fallback = MOCK_PROJECTS_MAP[params.id] || MOCK_PROJECTS_MAP['prj_horizon'];
  try {
    const project = await queryOne<any>('SELECT name FROM projects WHERE id = ?', [params.id]);
    return { title: project?.name ?? fallback.name };
  } catch {
    return { title: fallback.name };
  }
}

export default async function ProjectPage({ params }: Props) {
  const fallback = MOCK_PROJECTS_MAP[params.id] || MOCK_PROJECTS_MAP['prj_horizon'];
  const user = (await getServerUser()) || {
    id: 'usr_836f261323a28ad1',
    organization_id: 'org_default',
    email: 'harikeshav@specteros.agency',
    full_name: 'Harikeshav',
    role: 'owner',
    timezone: 'Asia/Kolkata',
  };

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
