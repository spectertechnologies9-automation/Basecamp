import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { Activity } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

export const metadata: Metadata = { title: 'My Activity' };

export default async function MyActivityPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  if (user.role !== 'admin' && user.role !== 'owner') {
    redirect('/dashboard');
  }

  const activity = await query<any>(
    `SELECT a.*, p.name as project_name
     FROM audit_logs a
     LEFT JOIN projects p ON p.id = a.entity_id
     WHERE a.actor_id = ?
     ORDER BY a.created_at DESC
     LIMIT 50`,
    [user.id]
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nf-bg)' }}>
      <GlobalNav />
      <NotificationPanel />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(57,198,174,0.15)', color: 'var(--nf-accent, #39C6AE)' }}>
                <Activity size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>My Activity</h1>
                <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>Your latest actions and milestone contributions</p>
              </div>
            </div>

            {activity.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
                <Activity size={40} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
                <p className="text-base font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>No activity recorded yet</p>
                <p className="text-sm mt-1" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>Your actions across projects, tasks, and campfire will stream here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl border transition-colors"
                    style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: 'var(--nf-accent, #39C6AE)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                        You <span className="font-bold" style={{ color: 'var(--nf-accent, #39C6AE)' }}>{item.action}</span>
                        {item.entity_type ? ` ${item.entity_type.replace(/_/g, ' ')}` : ''}
                        {item.project_name ? ` in ${item.project_name}` : ''}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                        {formatTimeAgo(item.created_at)}
                      </p>
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
