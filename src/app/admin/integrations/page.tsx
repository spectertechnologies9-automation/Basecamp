import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { canManageIntegrations } from '@/lib/permissions';
import type { UserRole } from '@/types';
import { IntegrationsView } from '@/components/admin/integrations-view';
import { SUPPORTED_INTEGRATIONS } from '@/lib/constants';

import { hasAdminAccess } from '@/lib/auth/admin';

export const metadata: Metadata = { title: 'Integrations' };

export default async function IntegrationsPage() {
  const isAdmin = await hasAdminAccess();
  let user = await getServerUser();

  if (!isAdmin && !user) redirect('/admin/login');
  if (!isAdmin && !canManageIntegrations(user?.role as UserRole)) redirect('/dashboard');

  const orgId = user?.organization_id || 'org_default';

  const integrations = await query<any>(
    'SELECT * FROM integrations WHERE organization_id = ?',
    [orgId]
  );

  const integrationMap = Object.fromEntries(integrations.map((i) => [i.provider, i]));
  const allIntegrations = SUPPORTED_INTEGRATIONS.map((provider) => integrationMap[provider] ?? {
    id: null,
    provider,
    status: 'disconnected',
    config: {},
    organization_id: orgId,
  });

  return <IntegrationsView integrations={allIntegrations as any[]} />;
}
