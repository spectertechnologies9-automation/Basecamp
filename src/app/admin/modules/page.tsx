import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';
import { ModulesView } from '@/components/modules/modules-view';

import { hasAdminAccess } from '@/lib/auth/admin';

export const metadata: Metadata = { title: 'Platform Modules Governance' };

const DEFAULT_MODULES = {
  campfire: true,
  message_board: true,
  card_table: true,
  hill_chart: true,
  check_ins: true,
  docs: true,
  time_tracking: true,
  whatsapp: true,
  ai_assistant: true,
};

export default async function AdminModulesPage() {
  const isAdmin = await hasAdminAccess();
  let user = await getServerUser();
  if (!isAdmin && !user) redirect('/admin/login');

  const orgId = user?.organization_id || 'org_default';

  await execute(`
    CREATE TABLE IF NOT EXISTS platform_modules (
      organization_id TEXT PRIMARY KEY,
      modules TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const row = await queryOne<any>(
    'SELECT modules FROM platform_modules WHERE organization_id = ?',
    [orgId]
  );

  const modules = row?.modules ? JSON.parse(row.modules) : DEFAULT_MODULES;

  return (
    <div className="p-6">
      <ModulesView initialModules={modules} />
    </div>
  );
}
