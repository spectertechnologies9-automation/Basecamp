import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { canManageOrganization } from '@/lib/permissions';
import type { UserRole } from '@/types';
import { SettingsView } from '@/components/admin/settings-view';

import { hasAdminAccess } from '@/lib/auth/admin';

export const metadata: Metadata = { title: 'Organization Settings' };

export default async function AdminSettingsPage() {
  const isAdmin = await hasAdminAccess();
  let user = await getServerUser();

  if (!isAdmin && !user) redirect('/admin/login');
  if (!isAdmin && !canManageOrganization(user?.role as UserRole)) redirect('/dashboard');

  const orgId = user?.organization_id || 'org_default';

  const org = await queryOne<any>(
    'SELECT * FROM organizations WHERE id = ?',
    [orgId]
  );

  return <SettingsView organization={org || { id: 'org_default', name: 'NexaFlow Systems', slug: 'nexaflow-systems' }} />;
}
