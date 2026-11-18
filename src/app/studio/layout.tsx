import { AppHeader } from '@/components/layout/app-header';
import { GlobalNav } from '@/components/layout/global-nav';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { getServerUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--nf-bg)' }}>
      <GlobalNav />
      <NotificationPanel />
      <AppHeader />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
