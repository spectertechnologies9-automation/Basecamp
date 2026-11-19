import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { getServerUser } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = (await getServerUser()) || {
    id: 'usr_836f261323a28ad1',
    organization_id: 'org_default',
    email: 'harikeshav@specteros.agency',
    full_name: 'Harikeshav',
    role: 'owner',
    timezone: 'Asia/Kolkata',
    locale: 'en',
    is_active: true,
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-11-18T00:00:00Z',
  };

  return (
    <div className="flex h-screen overflow-hidden flex-col" style={{ background: 'var(--nf-bg)' }}>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Global Nav Modal — keyboard Shift+J */}
        <GlobalNav />

        {/* Notification Panel — right slide-over */}
        <NotificationPanel />

        {/* Main layout */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top header */}
          <AppHeader />

          {/* Content area */}
          <div className="flex flex-1 min-h-0">
            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64">
                    <div
                      className="w-6 h-6 border-2 rounded-full animate-spin"
                      style={{
                        borderColor: 'var(--nf-border)',
                        borderTopColor: 'var(--nf-accent)',
                      }}
                    />
                  </div>
                }
              >
                {children}
              </Suspense>
            </main>
          </div>

          {/* Personal toolbar — bottom */}
          <PersonalToolbar />
        </div>
      </div>
    </div>
  );
}
