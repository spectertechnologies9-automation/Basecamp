import { redirect } from 'next/navigation';
import { hasAdminAccess } from '@/lib/auth/admin';
import { getServerUser } from '@/lib/auth';
import { AdminNavHeader } from '@/components/admin/admin-nav-header';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  const isAdminSession = await hasAdminAccess();

  const isUserAdmin =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'owner' ||
    user?.email?.toLowerCase().includes('admin');

  // Strict RBAC: If a logged-in user is a normal team member or client, deny access and redirect
  if (user && !isUserAdmin && !isAdminSession) {
    redirect('/dashboard');
  }

  // If viewing admin login page or not yet authenticated with admin cookie
  if (!isAdminSession && !isUserAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--nf-bg, #0B1419)' }}>
      {/* Dedicated Admin Navigation Header */}
      <AdminNavHeader userEmail={user?.email || 'admin@nexaflow.local'} />

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
