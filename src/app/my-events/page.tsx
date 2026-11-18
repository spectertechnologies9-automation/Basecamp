import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'My Events' };

export default async function MyEventsPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const events = await query<any>(
    `SELECT * FROM calendar_events
     WHERE (created_by = ? OR participant_ids LIKE ?)
     ORDER BY start_at ASC
     LIMIT 50`,
    [user.id, `%"${user.id}"%`]
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
            <div className="flex items-center justify-between mb-6 pb-3 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>My Events</h1>
                <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>Meetings and milestone schedules</p>
              </div>
              <Link
                href="/calendar"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
              >
                + Schedule Event
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
                <Calendar size={40} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
                <p className="text-base font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>No upcoming events</p>
                <p className="text-sm mt-1 mb-4" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>Events you create or are invited to will appear here.</p>
                <Link
                  href="/calendar"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
                >
                  Go to Calendar
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl border flex items-start justify-between"
                    style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>{ev.title}</p>
                      {ev.description && (
                        <p className="text-xs mt-1" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>{ev.description}</p>
                      )}
                      <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                        <Clock size={12} />
                        {new Date(ev.start_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        {ev.is_all_day ? ' (All day)' : ''}
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
