import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { CalendarView } from '@/components/calendar/calendar-view';

export const metadata: Metadata = { title: 'Calendar' };

export default async function CalendarPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const isAdmin = user.role === 'admin' || user.role === 'owner';

  // Fetch accessible projects for task/event scheduling
  const projects = isAdmin
    ? await query<any>('SELECT id, name FROM projects ORDER BY name ASC')
    : await query<any>(
        `SELECT DISTINCT p.id, p.name FROM projects p
         LEFT JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = ? OR p.owner_id = ?
         ORDER BY p.name ASC`,
        [user.id, user.id]
      );

  // Fetch calendar events
  const eventRows = await query<any>(
    isAdmin
      ? `SELECT * FROM calendar_events ORDER BY start_at ASC`
      : `SELECT * FROM calendar_events 
         WHERE created_by = ? OR participant_ids LIKE ?
         ORDER BY start_at ASC`,
    isAdmin ? [] : [user.id, `%"${user.id}"%`]
  );

  // Fetch todos with due dates to show on calendar
  const todoRows = await query<any>(
    isAdmin
      ? `SELECT t.id, t.title, t.due_date as start_at, t.priority, t.status, p.name as project_name, p.color as project_color
         FROM todos t
         JOIN projects p ON p.id = t.project_id
         WHERE t.due_date IS NOT NULL
         ORDER BY t.due_date ASC`
      : `SELECT t.id, t.title, t.due_date as start_at, t.priority, t.status, p.name as project_name, p.color as project_color
         FROM todos t
         JOIN projects p ON p.id = t.project_id
         WHERE (t.created_by = ? OR t.assignee_ids LIKE ?)
           AND t.due_date IS NOT NULL
         ORDER BY t.due_date ASC`,
    isAdmin ? [] : [user.id, `%"${user.id}"%`]
  );

  const combinedEvents = [
    ...eventRows.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      start_at: e.start_at,
      end_at: e.end_at,
      is_all_day: Boolean(e.is_all_day),
      type: 'event' as const,
      color: '#39C6AE',
    })),
    ...todoRows.map((t) => ({
      id: `todo_${t.id}`,
      title: `[Task] ${t.title}`,
      description: `${t.project_name} (${t.status})`,
      start_at: t.start_at,
      end_at: t.start_at,
      is_all_day: true,
      type: 'todo' as const,
      color: t.project_color || '#E9AC57',
    })),
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nf-bg)' }}>
      <GlobalNav />
      <NotificationPanel />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto">
            <CalendarView initialEvents={combinedEvents} currentUserId={user.id} projects={projects} />
          </main>
        </div>
        <PersonalToolbar />
      </div>
    </div>
  );
}
