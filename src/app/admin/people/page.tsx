import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { canManageOrganization } from '@/lib/permissions';
import type { UserRole } from '@/types';
import { PeopleView } from '@/components/admin/people-view';

import { hasAdminAccess } from '@/lib/auth/admin';

export const metadata: Metadata = { title: 'People & Permissions' };

export default async function AdminPeoplePage() {
  const isAdmin = await hasAdminAccess();
  let user: any = await getServerUser();

  if (!isAdmin && !user) redirect('/admin/login');
  if (!isAdmin && !canManageOrganization(user?.role as UserRole)) redirect('/dashboard');

  if (!user) {
    user = (await queryOne<any>('SELECT * FROM users WHERE role IN ("owner", "admin") ORDER BY created_at ASC LIMIT 1')) || {
      id: 'usr_admin',
      full_name: 'Administrator',
      email: 'admin@nexaflow.local',
      role: 'owner',
      organization_id: 'org_default',
    };
  }

  const orgId = user.organization_id || 'org_default';

  const rows = await query<any>(
    `SELECT u.id, u.full_name, u.email, u.role, u.is_active, u.last_seen_at, u.created_at, u.avatar_url
     FROM users u
     WHERE u.organization_id = ?
     ORDER BY u.created_at ASC`,
    [orgId]
  );

  const members = rows.map((u) => ({
    id: `mem_${u.id}`,
    role: u.role,
    user: {
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      avatar_url: u.avatar_url,
      is_active: Boolean(u.is_active),
      last_seen_at: u.last_seen_at,
      created_at: u.created_at,
    },
  }));

  return <PeopleView members={members as any} currentUserId={user.id} orgId={orgId} />;
}
