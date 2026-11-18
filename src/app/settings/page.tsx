import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { UserSettingsView } from '@/components/settings/user-settings-view';

export const metadata: Metadata = { title: 'Account Settings' };

export default async function SettingsPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const profile = await queryOne<any>(
    'SELECT id, organization_id, email, full_name, role, timezone, avatar_url, is_active, created_at, updated_at FROM users WHERE id = ?',
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
          <main className="flex-1 overflow-y-auto">
            <UserSettingsView user={profile || user} authEmail={user.email ?? ''} />
          </main>
        </div>
        <PersonalToolbar />
      </div>
    </div>
  );
}
