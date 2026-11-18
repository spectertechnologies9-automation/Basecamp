import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Everything' };

export default async function EverythingPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'admin' && user.role !== 'owner') {
    redirect('/dashboard');
  }

  const projects = await query<any>(
    `SELECT p.* FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     WHERE pm.user_id = ?
     ORDER BY p.name ASC`,
    [user.id]
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nf-bg)' }}>
      <GlobalNav />
      <NotificationPanel />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar className="hidden lg:flex" />
          <main className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
              <LayoutGrid size={22} style={{ color: 'var(--nf-accent)' }} />
              <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text)' }}>Everything</h1>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--nf-card)', color: 'var(--nf-text-muted)' }}>
                {projects.length} projects
              </span>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}>
                <LayoutGrid size={40} className="mx-auto mb-3" style={{ color: 'var(--nf-text-muted)' }} />
                <p className="text-base font-semibold" style={{ color: 'var(--nf-text)' }}>No projects found</p>
                <Link href="/projects/new" className="text-xs mt-3 inline-block font-medium hover:underline" style={{ color: 'var(--nf-accent)' }}>
                  + Create your first project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="p-5 rounded-xl border hover:shadow-md transition-all group"
                    style={{ background: 'var(--nf-card)', borderColor: 'var(--nf-border)', borderTopColor: p.color || '#39C6AE', borderTopWidth: '3px' }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: (p.color || '#39C6AE') + '22', color: p.color || '#39C6AE' }}>
                        {getInitials(p.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold group-hover:underline truncate" style={{ color: 'var(--nf-text)' }}>{p.name}</p>
                        <span className="text-[10px] capitalize font-medium" style={{ color: p.status === 'active' ? 'var(--nf-accent)' : 'var(--nf-text-muted)' }}>{p.status}</span>
                      </div>
                    </div>
                    {p.description && <p className="text-xs line-clamp-2" style={{ color: 'var(--nf-text-muted)' }}>{p.description}</p>}
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
        <PersonalToolbar />
      </div>
    </div>
  );
}
