import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth/admin';
import { query, queryOne, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/admin/users — list all users
export async function GET() {
  const isAdmin = await hasAdminAccess();
  const user = await getServerUser();
  if (!isAdmin && !user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const users = await query<any>(
    'SELECT id, organization_id, email, full_name, role, timezone, avatar_url, is_active, last_seen_at, created_at, updated_at FROM users ORDER BY created_at ASC'
  );

  return NextResponse.json<ApiResponse>({ data: users });
}

// POST /api/admin/users — revoke, restore, or update role
export async function POST(req: NextRequest) {
  const isAdmin = await hasAdminAccess();
  const user = await getServerUser();
  if (!isAdmin && !user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, action, role } = body;

    if (!userId) {
      return NextResponse.json<ApiResponse>({ error: 'Target userId is required' }, { status: 400 });
    }

    const targetUser = await queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return NextResponse.json<ApiResponse>({ error: 'User account not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const orgId = user?.organization_id || 'org_default';
    const actorId = user?.id || 'admin_gate';

    // 1. Revoke Access
    if (action === 'revoke') {
      if (user && user.id === userId) {
        return NextResponse.json<ApiResponse>({ error: 'You cannot revoke your own active administrator account' }, { status: 400 });
      }

      await execute('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?', [now, userId]);

      // Record in audit log
      await execute(
        'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`aud_${crypto.randomBytes(8).toString('hex')}`, orgId, actorId, `revoked access for ${targetUser.full_name} (${targetUser.email})`, 'user', userId, now]
      );

      return NextResponse.json<ApiResponse>({
        message: `Access successfully revoked for ${targetUser.full_name}`,
        data: { id: userId, is_active: 0 },
      });
    }

    // 2. Restore Access
    if (action === 'restore') {
      await execute('UPDATE users SET is_active = 1, updated_at = ? WHERE id = ?', [now, userId]);

      // Record in audit log
      await execute(
        'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`aud_${crypto.randomBytes(8).toString('hex')}`, orgId, actorId, `restored access for ${targetUser.full_name} (${targetUser.email})`, 'user', userId, now]
      );

      return NextResponse.json<ApiResponse>({
        message: `Access restored for ${targetUser.full_name}`,
        data: { id: userId, is_active: 1 },
      });
    }

    // 3. Update Role
    if (action === 'role' && role) {
      await execute('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, now, userId]);
      await execute('UPDATE organization_members SET role = ? WHERE user_id = ?', [role, userId]);

      // Record in audit log
      await execute(
        'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`aud_${crypto.randomBytes(8).toString('hex')}`, orgId, actorId, `changed role to ${role} for ${targetUser.full_name}`, 'user', userId, now]
      );

      return NextResponse.json<ApiResponse>({
        message: `Role updated to ${role} for ${targetUser.full_name}`,
        data: { id: userId, role },
      });
    }

    return NextResponse.json<ApiResponse>({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}

// DELETE /api/admin/users — permanently remove user
export async function DELETE(req: NextRequest) {
  const isAdmin = await hasAdminAccess();
  const user = await getServerUser();
  if (!isAdmin && !user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    let targetId = req.nextUrl.searchParams.get('id');
    if (!targetId) {
      const body = await req.json().catch(() => ({}));
      targetId = body.id || body.userId;
    }

    if (!targetId) {
      return NextResponse.json<ApiResponse>({ error: 'User ID is required' }, { status: 400 });
    }

    if (user && user.id === targetId) {
      return NextResponse.json<ApiResponse>({ error: 'You cannot delete your own active administrator account' }, { status: 400 });
    }

    const targetUser = await queryOne<any>('SELECT * FROM users WHERE id = ?', [targetId]);
    if (!targetUser) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    const orgId = user?.organization_id || 'org_default';
    const actorId = user?.id || 'admin_gate';
    const now = new Date().toISOString();

    await execute('DELETE FROM project_members WHERE user_id = ?', [targetId]);
    await execute('DELETE FROM organization_members WHERE user_id = ?', [targetId]);
    await execute('DELETE FROM users WHERE id = ?', [targetId]);

    await execute(
      'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`aud_${crypto.randomBytes(8).toString('hex')}`, orgId, actorId, `permanently deleted user account ${targetUser.full_name} (${targetUser.email})`, 'user', targetId, now]
    );

    return NextResponse.json<ApiResponse>({
      message: `Account for ${targetUser.full_name} permanently removed`,
      data: { id: targetId },
    });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Delete failed' }, { status: 500 });
  }
}
