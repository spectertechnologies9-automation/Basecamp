import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { hashPassword } from '@/lib/auth/local';
import type { ApiResponse } from '@/types';

// GET /api/team/members
export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const members = await query<any>(
    `SELECT id, organization_id, email, full_name, role, timezone, avatar_url, is_active, created_at, updated_at
     FROM users
     WHERE role != 'super_admin' AND role != 'owner' AND email != 'superadmin@specteros.agency'
     ORDER BY created_at ASC`
  );

  // Compute contribution metrics for each member
  const enrichedMembers = await Promise.all(
    members.map(async (m) => {
      // Completed todos
      const todosCount = await query<any>(
        'SELECT COUNT(*) as count FROM todos WHERE completed_by = ? OR (assignee_ids LIKE ? AND status = "completed")',
        [m.id, `%"${m.id}"%`]
      );
      // Projects participated
      const projectsCount = await query<any>(
        'SELECT COUNT(*) as count FROM project_members WHERE user_id = ?',
        [m.id]
      );
      // Comments count
      const commentsCount = await query<any>(
        'SELECT COUNT(*) as count FROM comments WHERE author_id = ?',
        [m.id]
      );

      return {
        ...m,
        contributions: {
          tasks_completed: todosCount[0]?.count ?? 0,
          projects_count: projectsCount[0]?.count ?? 0,
          comments_count: commentsCount[0]?.count ?? 0,
        },
      };
    })
  );

  return NextResponse.json<ApiResponse>({ data: enrichedMembers });
}

// POST /api/team/members — add/invite member
export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { full_name, email, role = 'member', password = 'Password123!' } = body;

    if (!full_name || !email) {
      return NextResponse.json<ApiResponse>({ error: 'Full name and email are required' }, { status: 400 });
    }

    // Never allow external or client UI to create a super_admin via member invite
    const sanitizedRole = (role === 'super_admin' || role === 'owner') ? 'member' : role;

    const normEmail = email.toLowerCase().trim();
    const existing = await query<any>('SELECT id FROM users WHERE email = ?', [normEmail]);
    if (existing.length > 0) {
      return NextResponse.json<ApiResponse>({ error: 'A user with this email address already exists' }, { status: 400 });
    }

    const newUserId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);
    const orgId = user.organization_id || 'org_default';

    await execute(
      `INSERT INTO users (id, organization_id, email, password_hash, full_name, role, timezone, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Asia/Kolkata', 1, ?, ?)`,
      [newUserId, orgId, normEmail, passwordHash, full_name.trim(), sanitizedRole, now, now]
    );

    await execute(
      'INSERT INTO organization_members (id, organization_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [`mem_${crypto.randomBytes(8).toString('hex')}`, orgId, newUserId, sanitizedRole, now]
    );

    // Audit log
    await execute(
      'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`aud_${crypto.randomBytes(8).toString('hex')}`, orgId, user.id, `added member ${full_name}`, 'user', newUserId, now]
    );

    const newMember = {
      id: newUserId,
      organization_id: orgId,
      email: normEmail,
      full_name: full_name.trim(),
      role: sanitizedRole,
      timezone: 'Asia/Kolkata',
      is_active: 1,
      created_at: now,
      updated_at: now,
      contributions: {
        tasks_completed: 0,
        projects_count: 0,
        comments_count: 0,
      },
    };

    return NextResponse.json<ApiResponse>({ data: newMember, message: 'Team member added' });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to add member' }, { status: 500 });
  }
}

// DELETE /api/team/members — remove team member
export async function DELETE(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    let targetId = req.nextUrl.searchParams.get('id');
    if (!targetId) {
      const body = await req.json().catch(() => ({}));
      targetId = body.id;
    }

    if (!targetId) {
      return NextResponse.json<ApiResponse>({ error: 'Member ID is required' }, { status: 400 });
    }

    if (targetId === user.id) {
      return NextResponse.json<ApiResponse>({ error: 'You cannot remove your own active account' }, { status: 400 });
    }

    const targetUser = await query<any>('SELECT id, full_name, role, email FROM users WHERE id = ?', [targetId]);
    if (!targetUser.length) {
      return NextResponse.json<ApiResponse>({ error: 'Member not found' }, { status: 404 });
    }

    const isCallerSuperAdmin = user.role === 'super_admin' || user.role === 'owner' || user.email === 'superadmin@specteros.agency';
    const isTargetSuperAdmin = targetUser[0].role === 'super_admin' || targetUser[0].role === 'owner' || targetUser[0].email === 'superadmin@specteros.agency';

    if (isTargetSuperAdmin && !isCallerSuperAdmin) {
      return NextResponse.json<ApiResponse>({ error: 'Member not found' }, { status: 404 });
    }

    const isTargetAdmin = targetUser[0].role === 'admin';
    if (isTargetAdmin && !isCallerSuperAdmin) {
      return NextResponse.json<ApiResponse>(
        { error: 'Only Super Administrator has authority to remove an Administrator account' },
        { status: 403 }
      );
    }

    const memberName = targetUser[0].full_name;
    const orgId = user.organization_id || 'org_default';
    const now = new Date().toISOString();

    // Remove from project_members, organization_members, and delete user
    await execute('DELETE FROM project_members WHERE user_id = ?', [targetId]);
    await execute('DELETE FROM organization_members WHERE user_id = ?', [targetId]);
    await execute('DELETE FROM users WHERE id = ?', [targetId]);

    // Record in audit log
    await execute(
      'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`aud_${crypto.randomBytes(8).toString('hex')}`, orgId, user.id, `removed member ${memberName}`, 'user', targetId, now]
    );

    return NextResponse.json<ApiResponse>({
      message: `Member ${memberName} removed successfully`,
      data: { id: targetId },
    });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to remove member' }, { status: 500 });
  }
}
