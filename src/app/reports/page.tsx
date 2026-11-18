import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { BarChart2, CheckCircle2, Clock, FolderGit2, Users } from 'lucide-react';

export const metadata: Metadata = { title: 'Reports & Analytics' };

export default async function ReportsPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'admin' && user.role !== 'owner') {
    redirect('/dashboard');
  }

  const [projectCount, openTodosCount, completedTodosCount, memberCount] = await Promise.all([
    queryOne<{ count: number }>(
      'SELECT count(*) as count FROM project_members WHERE user_id = ?',
      [user.id]
    ),
    queryOne<{ count: number }>(
      "SELECT count(*) as count FROM todos WHERE status != 'completed'"
    ),
    queryOne<{ count: number }>(
      "SELECT count(*) as count FROM todos WHERE status = 'completed'"
    ),
    queryOne<{ count: number }>(
      'SELECT count(*) as count FROM users WHERE organization_id = ?',
      [user.organization_id || 'org_default']
    ),
  ]);

  const recentCompleted = await query<any>(
    `SELECT t.id, t.title, t.completed_at, p.name as project_name, p.color as project_color
     FROM todos t
     JOIN projects p ON p.id = t.project_id
     WHERE t.status = 'completed'
     ORDER BY t.completed_at DESC
     LIMIT 5`
  );

  const stats = [
    { label: 'Your Projects', value: projectCount?.count ?? 0, icon: FolderGit2, color: 'var(--nf-accent, #39C6AE)' },
    { label: 'Open Tasks', value: openTodosCount?.count ?? 0, icon: Clock, color: '#E9AC57' },
    { label: 'Completed Tasks', value: completedTodosCount?.count ?? 0, icon: CheckCircle2, color: '#52B788' },
    { label: 'Team Members', value: memberCount?.count ?? 1, icon: Users, color: '#6C8EBF' },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nf-bg)' }}>
      <GlobalNav />
      <NotificationPanel />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar className="hidden lg:flex" />
          <main className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(57,198,174,0.15)', color: 'var(--nf-accent, #39C6AE)' }}>
                <BarChart2 size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Reports &amp; Metrics</h1>
                <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>Operational statistics, burndown velocity, and team throughput</p>
              </div>
            </div>

            {/* Overview stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="p-5 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>{s.label}</span>
                      <Icon size={18} style={{ color: s.color }} />
                    </div>
                    <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Recently Completed Milestones */}
            <div className="p-6 rounded-2xl border mb-6" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
              <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                Recently Resolved Tasks
              </h2>
              {recentCompleted.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  No tasks marked as completed yet. Complete items in your project boards to see them recorded here.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {recentCompleted.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--nf-panel, #131E24)' }}>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>{t.title}</p>
                          <span className="text-[10px]" style={{ color: t.project_color || 'var(--nf-accent, #39C6AE)' }}>{t.project_name}</span>
                        </div>
                      </div>
                      <span className="text-[10px]" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                        {t.completed_at ? new Date(t.completed_at).toLocaleDateString() : 'Done'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
        <PersonalToolbar />
      </div>
    </div>
  );
}
