import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasAdminAccess } from '@/lib/auth/admin';
import { AuditLogsView } from '@/components/admin/audit-logs-view';

export const metadata: Metadata = { title: 'Security & Audit Log' };

export default async function AdminAuditPage() {
  const isAdmin = await hasAdminAccess();
  const user = await getServerUser();
  if (!isAdmin && !user) redirect('/admin/login');

  const logs = await query<any>(
    `SELECT a.*, u.full_name as actor_name, u.email as actor_email
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT 100`
  );

  return <AuditLogsView initialLogs={logs} />;
}
