import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth/admin';
import { query, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/admin/audit — fetch audit logs
export async function GET() {
  const isAdmin = await hasAdminAccess();
  const user = await getServerUser();
  if (!isAdmin && !user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const logs = await query<any>(
    `SELECT a.*, u.full_name as actor_name, u.email as actor_email
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT 200`
  );

  return NextResponse.json<ApiResponse>({ data: logs });
}

// DELETE /api/admin/audit — clear audit trail
export async function DELETE() {
  const isAdmin = await hasAdminAccess();
  const user = await getServerUser();
  if (!isAdmin && !user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = user?.organization_id || 'org_default';
    const actorId = user?.id || 'admin_gate';
    const actorName = user?.full_name || 'Administrator';
    const now = new Date().toISOString();

    // Clear all audit logs
    await execute('DELETE FROM audit_logs');

    // Insert an initial entry noting the audit log clear action
    const newLogId = `aud_${crypto.randomBytes(8).toString('hex')}`;
    await execute(
      'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newLogId, orgId, actorId, `cleared audit logs (${actorName})`, 'system', newLogId, now]
    );

    return NextResponse.json<ApiResponse>({
      message: 'Audit logs cleared successfully.',
      data: { remaining: 1 },
    });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to clear audit logs' }, { status: 500 });
  }
}
