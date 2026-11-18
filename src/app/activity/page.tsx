import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { Activity } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

export const metadata: Metadata = { title: 'Activity' };

export default async function ActivityPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'admin' && user.role !== 'owner') {
    redirect('/dashboard');
  }

  const rows = await query<any>(
    `SELECT a.*, u.full_name as actor_name
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     WHERE a.organization_id = ?
     ORDER BY a.created_at DESC
     LIMIT 50`,
    [user.organization_id || 'org_default']
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nf-bg)' }}>
      <GlobalNav />
      <NotificationPanel />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar className="hidden lg:flex" />
          <main className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={22} style={{ color: 'var(--nf-accent)' }} />
              <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text)' }}>Activity</h1>
            </div>
            {rows.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--nf-text)' }}>No activity recorded yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--nf-text-muted)' }}>Actions performed across your projects will show up here.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {rows.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors border-b last:border-0" style={{ borderColor: 'var(--nf-border)' }}>
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: 'var(--nf-card)', color: 'var(--nf-accent)' }}>
                      {(item.actor_name ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--nf-text)' }}>
                        <span className="font-semibold">{item.actor_name ?? 'Team member'}</span>
                        {' '}<span style={{ color: 'var(--nf-text-muted)' }}>{item.action}</span>
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--nf-text-muted)' }}>{formatTimeAgo(item.created_at)}</p>
                    </div>
                  </div>
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
