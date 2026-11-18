import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { execute } from '@/lib/db';
import { canManageOrganization } from '@/lib/permissions';
import type { UserRole, ApiResponse } from '@/types';

// PATCH /api/admin/settings — update org settings
export async function PATCH(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  if (!canManageOrganization(user.role as UserRole)) {
    return NextResponse.json<ApiResponse>({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, timezone } = body;
    const orgId = user.organization_id || 'org_default';

    if (name) {
      await execute('UPDATE organizations SET name = ? WHERE id = ?', [name.trim(), orgId]);
    }
    if (timezone) {
      await execute('UPDATE organizations SET timezone = ? WHERE id = ?', [timezone, orgId]);
    }

    const now = new Date().toISOString();
    await execute(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`aud_${crypto.randomBytes(8).toString('hex')}`, orgId, user.id, 'updated organization settings', 'organization', orgId, now]
    );

    return NextResponse.json<ApiResponse>({ message: 'Settings updated' });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}
