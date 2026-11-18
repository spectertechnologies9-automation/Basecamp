import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { MyBookmarksView } from '@/components/personal/my-bookmarks-view';

export const metadata: Metadata = { title: 'My Bookmarks' };

export default async function MyBookmarksPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  if (user.role !== 'admin' && user.role !== 'owner') {
    redirect('/dashboard');
  }

  const bookmarks = await query<any>(
    'SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC',
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
            <MyBookmarksView initialBookmarks={bookmarks} currentUserId={user.id} />
          </main>
        </div>
        <PersonalToolbar />
      </div>
    </div>
  );
}
