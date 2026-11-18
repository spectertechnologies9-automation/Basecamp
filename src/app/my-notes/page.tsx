import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { MyNotesView } from '@/components/personal/my-notes-view';

export const metadata: Metadata = { title: 'My Notes' };

export default async function MyNotesPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  if (user.role !== 'admin' && user.role !== 'owner') {
    redirect('/dashboard');
  }

  const notes = await query<any>(
    'SELECT * FROM personal_notes WHERE user_id = ? ORDER BY updated_at DESC',
    [user.id]
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nf-bg)' }}>
      <GlobalNav />
      <NotificationPanel />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto">
            <MyNotesView initialNotes={notes} currentUserId={user.id} />
          </main>
        </div>
        <PersonalToolbar />
      </div>
    </div>
  );
}
