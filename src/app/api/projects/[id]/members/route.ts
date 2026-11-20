import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

interface Ctx {
  params: { id: string };
}

// Check if user is admin or project lead
async function canManageProject(userId: string, userRole: string, projectId: string) {
  if (userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin') return true;
  const leadMember = await queryOne<any>(
    "SELECT id FROM project_members WHERE project_id = ? AND user_id = ? AND (role = 'lead' OR role = 'owner')",
    [projectId, userId]
  );
  return Boolean(leadMember);
}

// GET /api/projects/:id/members — list project members
export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const members = await query<any>(
    `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.created_at,
            u.full_name, u.email, u.avatar_url, u.role as global_role
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ?
       AND u.role != 'super_admin'
       AND u.role != 'owner'
       AND u.email != 'superadmin@specteros.agency'
     ORDER BY CASE pm.role WHEN 'owner' THEN 1 WHEN 'lead' THEN 2 WHEN 'member' THEN 3 ELSE 4 END ASC`,
    [params.id]
  );

  return NextResponse.json<ApiResponse>({ data: members });
}

// POST /api/projects/:id/members — add member to project
export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await canManageProject(user.id, user.role, params.id);
  if (!allowed) {
    return NextResponse.json<ApiResponse>(
      { error: 'Only admins and team leads can assign project members' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    let targetUserId = body.user_id;
    const role = body.role || 'member';

    // If email provided instead of user_id, lookup user
    if (!targetUserId && body.email) {
      const existingUser = await queryOne<any>('SELECT id FROM users WHERE email = ?', [body.email.toLowerCase().trim()]);
      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        return NextResponse.json<ApiResponse>({ error: 'User not found with this email' }, { status: 404 });
      }
    }

    if (!targetUserId) {
      return NextResponse.json<ApiResponse>({ error: 'User ID or email is required' }, { status: 400 });
    }

    // Check if already a member
    const existing = await queryOne<any>(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [params.id, targetUserId]
    );

    const now = new Date().toISOString();
    if (existing) {
      await execute(
        'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
        [role, params.id, targetUserId]
      );
    } else {
      await execute(
        'INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
        [`pm_${crypto.randomBytes(8).toString('hex')}`, params.id, targetUserId, role, now]
      );
    }

    // Automatically assign or upgrade workspace role if user currently has role_not_assigned, or if workspace_role is specified
    const targetUserRow = await queryOne<any>('SELECT role FROM users WHERE id = ?', [targetUserId]);
    if (targetUserRow) {
      const explicitWorkspaceRole = body.workspace_role;
      if (explicitWorkspaceRole) {
        await execute('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [explicitWorkspaceRole, now, targetUserId]);
        await execute('UPDATE organization_members SET role = ? WHERE user_id = ?', [explicitWorkspaceRole, targetUserId]);
      } else if (targetUserRow.role === 'role_not_assigned' || targetUserRow.role === 'unassigned' || !targetUserRow.role) {
        const assignedRole = role === 'lead' ? 'project_manager' : role === 'client' ? 'client' : 'member';
        await execute('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [assignedRole, now, targetUserId]);
        await execute('UPDATE organization_members SET role = ? WHERE user_id = ?', [assignedRole, targetUserId]);
      }
    }

    const updated = await queryOne<any>(
      `SELECT pm.*, u.full_name, u.email, u.avatar_url
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ? AND pm.user_id = ?`,
      [params.id, targetUserId]
    );

    return NextResponse.json<ApiResponse>({ data: updated, message: 'Member updated in project' });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to add member' }, { status: 500 });
  }
}

// PATCH /api/projects/:id/members — update member role
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await canManageProject(user.id, user.role, params.id);
  if (!allowed) {
    return NextResponse.json<ApiResponse>(
      { error: 'Only admins and team leads can assign project roles' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json<ApiResponse>({ error: 'user_id and role are required' }, { status: 400 });
    }

    await execute(
      'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
      [role, params.id, user_id]
    );

    return NextResponse.json<ApiResponse>({ message: 'Project role updated successfully' });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to update role' }, { status: 500 });
  }
}

// DELETE /api/projects/:id/members — remove member from project
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await canManageProject(user.id, user.role, params.id);
  if (!allowed) {
    return NextResponse.json<ApiResponse>(
      { error: 'Only admins and team leads can remove project members' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('user_id');

  if (!targetUserId) {
    return NextResponse.json<ApiResponse>({ error: 'user_id is required' }, { status: 400 });
  }

  await execute(
    'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
    [params.id, targetUserId]
  );

  return NextResponse.json<ApiResponse>({ message: 'Member removed from project' });
}
