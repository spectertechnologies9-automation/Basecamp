import type { Metadata } from 'next';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { ProjectsListView } from '@/components/projects/projects-list-view';

export const metadata: Metadata = {
  title: 'Projects — Tifferend OS',
  description: 'Manage agency projects, client assignments, and tools.',
};

export default async function ProjectsPage() {
  const user = await getServerUser();

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  // Fetch projects and dynamic todo task completion stats from SQLite
  const [dbProjects, todoStatsRows] = await Promise.all([
    isAdmin
      ? query<any>("SELECT * FROM projects WHERE status != 'archived' AND status != 'deleted' ORDER BY created_at DESC")
      : user
      ? query<any>(
          `SELECT DISTINCT p.* FROM projects p
           LEFT JOIN project_members pm ON pm.project_id = p.id
           WHERE (pm.user_id = ? OR p.owner_id = ?)
             AND p.status != 'archived' AND p.status != 'deleted'
           ORDER BY p.created_at DESC`,
          [user.id, user.id]
        )
      : Promise.resolve([]),
    query<any>(
      `SELECT project_id, 
              COUNT(*) as total_count,
              SUM(CASE WHEN status IN ('completed', 'done') THEN 1 ELSE 0 END) as completed_count
       FROM todos
       GROUP BY project_id`
    ),
  ]);

  const projectStatsMap = new Map<string, { total: number; completed: number; progress: number }>();
  for (const row of (todoStatsRows || [])) {
    const total = Number(row.total_count) || 0;
    const completed = Number(row.completed_count) || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    projectStatsMap.set(row.project_id, { total, completed, progress });
  }

  const formattedProjects = dbProjects.map((p) => {
    const stats = projectStatsMap.get(p.id) || { total: 0, completed: 0, progress: 0 };
    return {
      id: p.id,
      name: p.name,
      clientName: p.client_name || 'PROJECT',
      description: p.description || '',
      category: p.category || 'general',
      status: p.status || 'active',
      dueDate: p.end_date || '2026-10-31',
      progress: stats.progress,
      totalItems: stats.total,
      completedItems: stats.completed,
    };
  });

  const fallbackProjects = [
    {
      id: 'prj_2e2afb329d16ec4b',
      name: 'test',
      clientName: 'PROJECT',
      description: 'Internal testing workspace and design QA',
      category: 'general',
      status: 'active',
      dueDate: '2026-11-30',
      progress: 0,
      totalItems: 3,
      completedItems: 0,
    },
    {
      id: 'prj_2dc1a5bcddbd4de9',
      name: 'brand launch',
      clientName: 'PROJECT',
      description: 'Brand launch campaign, identity rollout, and merchandise',
      category: 'general',
      status: 'active',
      dueDate: '2026-12-15',
      progress: 0,
      totalItems: 3,
      completedItems: 0,
    },
    {
      id: 'prj_horizon',
      name: 'Editorial & Interactive Lookbook',
      clientName: 'HORIZON APPAREL',
      description: 'High-fashion editorial site, lookbook and seasonal campaign',
      category: 'general',
      status: 'active',
      dueDate: '2026-11-28',
      progress: 35,
      totalItems: 4,
      completedItems: 1,
    },
    {
      id: 'prj_kallisto',
      name: 'Kallisto Sound Labs',
      clientName: 'KALLISTO SOUND LABS',
      description: 'Acoustic engineering branding, packaging and 3D product animations',
      category: 'general',
      status: 'active',
      dueDate: '2026-12-05',
      progress: 50,
      totalItems: 6,
      completedItems: 3,
    },
  ];

  const finalProjects = formattedProjects.length > 0 ? formattedProjects : fallbackProjects;

  return (
    <div className="w-full">
      <main className="max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-10 py-8">
        <ProjectsListView initialProjects={finalProjects} />
      </main>
    </div>
  );
}
