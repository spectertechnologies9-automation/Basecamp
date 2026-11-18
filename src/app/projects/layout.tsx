import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { getServerUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nf-bg)' }}>
      <GlobalNav />
      <NotificationPanel />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div
                    className="w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'var(--nf-border)', borderTopColor: 'var(--nf-accent)' }}
                  />
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
        <PersonalToolbar />
      </div>
    </div>
  );
}
